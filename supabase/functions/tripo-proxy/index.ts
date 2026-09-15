import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Supabase Edge Function: tripo-proxy
 *
 * Proxy seguro para a API Tripo 3D AI v3 com proteção contra vulnerabilidades (SSRF, Injection, etc.)
 * e controle estrito de CORS e tipos.
 */

const TRIPO_BASE_URL = 'https://openapi.tripo3d.ai';
const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // Limite máximo de 15 MB por foto

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
};

/**
 * Validação rigorosa de segurança contra SSRF (Server-Side Request Forgery)
 * Bloqueia acessos a redes internas, localhost, metadados da nuvem e IPs privados.
 */
function validateSafeImageUrl(urlStr: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(urlStr);

    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Apenas URLs HTTPS seguras são permitidas.' };
    }

    const host = parsed.hostname.toLowerCase();

    // Bloquear localhost e nomes de loopback
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return { valid: false, error: 'Endereços locais ou internos não são permitidos.' };
    }

    // Bloquear IPs privados e reservados (IPv4)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipv4Regex);
    if (match) {
      const [_, o1, o2] = match.map(Number);
      if (
        o1 === 127 || // Loopback 127.0.0.0/8
        o1 === 10 || // Private 10.0.0.0/8
        o1 === 0 || // 0.0.0.0/8
        (o1 === 172 && o2 >= 16 && o2 <= 31) || // Private 172.16.0.0/12
        (o1 === 192 && o2 === 168) || // Private 192.168.0.0/16
        (o1 === 169 && o2 === 254) // Link-local / Cloud Metadata 169.254.0.0/16
      ) {
        return { valid: false, error: 'IPs privados ou de metadados não são permitidos.' };
      }
    }

    // Bloquear IPv6 loopback / local
    if (host === '[::1]' || host === '::1' || host.startsWith('fe80:') || host.startsWith('fc00:')) {
      return { valid: false, error: 'IPs IPv6 privados não são permitidos.' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Formato de URL inválido.' };
  }
}

/**
 * Validação de ID de tarefa Tripo para prevenir injeção de rotas
 */
function isValidTaskId(taskId: string): boolean {
  return /^[a-zA-Z0-9_\-]{4,100}$/.test(taskId);
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Tratar requisição de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Método não permitido. Utilize POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const TRIPO_API_KEY = Deno.env.get('TRIPO_API_KEY');
    if (!TRIPO_API_KEY || TRIPO_API_KEY.trim() === '') {
      return new Response(
        JSON.stringify({
          error: 'TRIPO_API_KEY não configurada no Supabase. Configure em Project Settings > Edge Functions > Secrets.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let body: Record<string, any> = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Corpo da requisição JSON inválido.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const action = body.action || (body.taskId || body.task_id ? 'status' : 'create');

    // -------------------------------------------------------------------------
    // 1. ACTION: CREATE — Download seguro da foto + Upload Tripo + Gerar Modelo
    // -------------------------------------------------------------------------
    if (action === 'create') {
      const imageUrl = String(body.imageUrl || body.image_url || '').trim();

      if (!imageUrl) {
        return new Response(
          JSON.stringify({ error: 'Parâmetro "imageUrl" é obrigatório.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Validação de SSRF
      const urlValidation = validateSafeImageUrl(imageUrl);
      if (!urlValidation.valid) {
        return new Response(
          JSON.stringify({ error: `URL não permitida: ${urlValidation.error}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Download da imagem com validação de tamanho e tipo
      let imageBlob: Blob;
      try {
        const imgResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'DegustAR-EdgeFunction/1.0',
          },
        });

        if (!imgResponse.ok) {
          throw new Error(`Falha ao acessar imagem (${imgResponse.status})`);
        }

        const contentType = (imgResponse.headers.get('content-type') || '').toLowerCase();
        if (
          !contentType.startsWith('image/') &&
          !contentType.includes('octet-stream') &&
          !imageUrl.match(/\.(jpg|jpeg|png|webp|heic)$/i)
        ) {
          return new Response(
            JSON.stringify({ error: 'O link fornecido não é uma imagem válida.' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const contentLength = Number(imgResponse.headers.get('content-length') || '0');
        if (contentLength > MAX_IMAGE_BYTES) {
          return new Response(
            JSON.stringify({ error: `Imagem excede o limite máximo permitido de 15MB.` }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        imageBlob = await imgResponse.blob();

        if (imageBlob.size > MAX_IMAGE_BYTES) {
          return new Response(
            JSON.stringify({ error: `Imagem excede o limite de 15MB.` }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao baixar imagem';
        return new Response(
          JSON.stringify({ error: `Erro no download da foto: ${msg}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Upload do arquivo para a API Tripo v3 (/v3/files)
      const formData = new FormData();
      formData.append('file', imageBlob, 'dish-photo.jpg');

      const uploadRes = await fetch(`${TRIPO_BASE_URL}/v3/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TRIPO_API_KEY}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('Erro no upload para Tripo 3D:', uploadRes.status, errorText);
        return new Response(
          JSON.stringify({
            error: `Erro ao enviar foto para o serviço de IA 3D (${uploadRes.status})`,
          }),
          {
            status: uploadRes.status >= 400 && uploadRes.status < 500 ? uploadRes.status : 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const uploadData = await uploadRes.json();
      const fileToken = uploadData.data?.file_token;

      if (!fileToken) {
        return new Response(
          JSON.stringify({ error: 'Resposta inválida do serviço de IA 3D.' }),
          {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Iniciar a geração 3D (/v3/generation/image-to-model)
      const createRes = await fetch(`${TRIPO_BASE_URL}/v3/generation/image-to-model`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TRIPO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'v3.1-20260211',
          file: {
            type: 'jpg',
            file_token: fileToken,
          },
        }),
      });

      if (!createRes.ok) {
        const errorText = await createRes.text();
        console.error('Erro ao criar task Tripo 3D:', createRes.status, errorText);
        return new Response(
          JSON.stringify({
            error: `Erro ao inicializar reconstrução 3D (${createRes.status})`,
          }),
          {
            status: createRes.status >= 400 && createRes.status < 500 ? createRes.status : 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const createData = await createRes.json();
      const taskId = createData.data?.task_id;

      if (!taskId) {
        return new Response(
          JSON.stringify({ error: 'Identificador de tarefa não foi retornado pelo serviço 3D.' }),
          {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ taskId, status: 'queued' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // -------------------------------------------------------------------------
    // 2. ACTION: STATUS — Consulta segura de status da tarefa
    // -------------------------------------------------------------------------
    if (action === 'status') {
      const taskId = String(body.taskId || body.task_id || '').trim();

      if (!taskId || !isValidTaskId(taskId)) {
        return new Response(
          JSON.stringify({ error: 'Identificador de tarefa (taskId) inválido.' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const statusRes = await fetch(`${TRIPO_BASE_URL}/v3/tasks/${encodeURIComponent(taskId)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TRIPO_API_KEY}`,
        },
      });

      if (!statusRes.ok) {
        return new Response(
          JSON.stringify({
            error: `Erro ao consultar status da tarefa 3D (${statusRes.status})`,
          }),
          {
            status: statusRes.status >= 400 && statusRes.status < 500 ? statusRes.status : 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const resData = await statusRes.json();
      const taskData = resData.data || {};
      const output = taskData.output || {};
      const modelUrl =
        output.pbr_model_url ||
        output.model_url ||
        output.base_model_url ||
        output.pbr_model?.url ||
        output.model?.url ||
        taskData.result?.pbr_model?.url ||
        taskData.result?.model?.url ||
        null;

      return new Response(
        JSON.stringify({
          id: taskData.task_id || taskId,
          status: taskData.status || 'unknown',
          progress: typeof taskData.progress === 'number' ? taskData.progress : 0,
          model_url: modelUrl,
          rendered_image_url: output.rendered_image_url || output.preview_url || null,
          error: taskData.error_message || null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: `Ação "${action}" desconhecida. Utilize "create" ou "status".`,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro interno';
    console.error('Exceção na Edge Function tripo-proxy:', err);
    return new Response(
      JSON.stringify({ error: `Erro interno no servidor: ${msg}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

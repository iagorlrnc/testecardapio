/**
 * tripoService.ts — Serviço de integração com Tripo 3D AI para geração 3D
 *
 * Fluxo:
 * 1. Admin faz upload de fotos → Supabase Storage (dish-photos)
 * 2. Foto é enviada ao Edge Function proxy → Tripo 3D API v3
 * 3. Polling de status até SUCCESS
 * 4. .glb gerado é baixado e armazenado no Supabase Storage (dish-models)
 *
 * API Tripo v3:
 * - Upload: POST /v3/files (multipart/form-data) → file_token
 * - Create: POST /v3/generation/image-to-model { file_token } → task_id
 * - Poll:   GET  /v3/tasks/{task_id} → status, output.model_url
 * - Model URLs expiram em 5 minutos — baixado imediatamente e salvo no Supabase Storage!
 */

import { supabase, isSupabaseConfigured } from './supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type TripoTaskStatus =
  | 'queued'
  | 'running'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'unknown';

export interface TripoTaskResult {
  id: string;
  status: TripoTaskStatus;
  progress: number;           // 0-100
  model_url?: string;         // GLB URL (expires in 5 min!)
  rendered_image_url?: string;
  error?: string;
}

export interface CreateTaskResponse {
  taskId: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const TRIPO_API_KEY = import.meta.env.VITE_TRIPO_API_KEY || '';
const TRIPO_BASE_URL = 'https://openapi.tripo3d.ai';

/**
 * Checks if we have a real Tripo API key configured
 */
export const isTripoConfigured = (): boolean => {
  return (
    typeof TRIPO_API_KEY === 'string' &&
    TRIPO_API_KEY.length > 10 &&
    TRIPO_API_KEY !== 'your_tripo_api_key_here'
  );
};

// ---------------------------------------------------------------------------
// 1. Upload Photos to Supabase Storage
// ---------------------------------------------------------------------------

/**
 * Upload a single photo file to Supabase Storage (dish-photos bucket)
 * Returns the public URL of the uploaded image
 */
export async function uploadPhotoToStorage(
  file: File,
  dishId: string,
  slotId: string
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const filePath = `${dishId}/${slotId}_${timestamp}.${ext}`;

  // If Supabase is configured, upload to Storage
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.storage
      .from('dish-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      throw new Error(`Falha no upload da foto: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('dish-photos')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  // Fallback: return local object URL (for demo/local dev)
  return URL.createObjectURL(file);
}

/**
 * Upload multiple photo files at once, returns array of public URLs
 */
export async function uploadMultiplePhotos(
  files: { file: File; slotId: string }[],
  dishId: string
): Promise<string[]> {
  const urls = await Promise.all(
    files.map(({ file, slotId }) => uploadPhotoToStorage(file, dishId, slotId))
  );
  return urls;
}

// ---------------------------------------------------------------------------
// 2. Create Image-to-3D Task (via Tripo 3D API v3)
// ---------------------------------------------------------------------------

/**
 * Submit photo to Tripo 3D to generate a 3D model.
 * Uses the Edge Function proxy (secure, server-side key).
 *
 * Tripo v3 workflow:
 * 1. Upload image → /v3/files → file_token
 * 2. Create task → /v3/generation/image-to-model { file_token } → task_id
 *
 * The Edge Function handles both steps so the API key stays server-side.
 */
export async function createImageTo3DTask(
  imageUrl: string,
  _additionalUrls: string[] = [],
  _plateWidthCm: number = 28
): Promise<CreateTaskResponse> {
  // Try Edge Function proxy first (secure, server-side key)
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.functions.invoke('tripo-proxy', {
        body: {
          action: 'create',
          imageUrl,
        },
      });

      if (error) throw error;
      if (data?.taskId) return { taskId: data.taskId };
      throw new Error(data?.error || 'Edge Function retornou resposta inválida');
    } catch (err: any) {
      console.warn('Edge Function call failed, trying direct API:', err.message);
    }
  }

  // Fallback: Direct API call (if client key exists)
  if (isTripoConfigured()) {
    // Step 1: Upload image to Tripo
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const formData = new FormData();
    formData.append('file', imageBlob, 'dish-photo.jpg');

    const uploadRes = await fetch(`${TRIPO_BASE_URL}/v3/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIPO_API_KEY}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error(`Tripo file upload error: ${uploadRes.status}`);
    }

    const uploadData = await uploadRes.json();
    const fileToken = uploadData.data?.file_token;
    if (!fileToken) throw new Error('Tripo não retornou file_token');

    // Step 2: Create generation task
    const createRes = await fetch(`${TRIPO_BASE_URL}/v3/generation/image-to-model`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TRIPO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_token: fileToken,
        texture: true,
        pbr: true,
        face_limit: 30000,
      }),
    });

    if (!createRes.ok) {
      const errorData = await createRes.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Tripo API error: ${createRes.status} ${createRes.statusText}`
      );
    }

    const createData = await createRes.json();
    return { taskId: createData.data?.task_id };
  }

  // No API configured: simulate for demo purposes
  return simulateCreateTask();
}

// ---------------------------------------------------------------------------
// 3. Poll Task Status
// ---------------------------------------------------------------------------

/**
 * Check the status of a Tripo 3D generation task.
 * GET /v3/tasks/{task_id}
 */
export async function pollTaskStatus(taskId: string): Promise<TripoTaskResult> {
  // Try Edge Function proxy first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.functions.invoke('tripo-proxy', {
        body: {
          action: 'status',
          taskId,
        },
      });

      if (error) throw error;
      if (data) return data as TripoTaskResult;
    } catch (err: any) {
      console.warn('Edge Function poll failed, trying direct API:', err.message);
    }
  }

  // Fallback: Direct API call
  if (isTripoConfigured()) {
    const response = await fetch(
      `${TRIPO_BASE_URL}/v3/tasks/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${TRIPO_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Tripo API poll error: ${response.status}`);
    }

    const resData = await response.json();
    const taskData = resData.data || {};
    const output = taskData.output || {};
    const modelUrl =
      output.pbr_model_url ||
      output.model_url ||
      output.base_model_url ||
      output.pbr_model?.url ||
      output.model?.url ||
      taskData.result?.pbr_model?.url ||
      taskData.result?.model?.url;

    return {
      id: taskData.task_id || taskId,
      status: taskData.status,
      progress: taskData.progress || 0,
      model_url: modelUrl,
      rendered_image_url: output.rendered_image_url || output.preview_url,
    };
  }

  // No API: simulate
  return simulatePollTask(taskId);
}

// ---------------------------------------------------------------------------
// 4. Download and Store Model in Supabase Storage
// ---------------------------------------------------------------------------

/**
 * Download the generated .glb model from Tripo 3D and store it in Supabase Storage.
 * IMPORTANT: Tripo model URLs expire in 5 minutes! Must download immediately.
 * Returns the permanent public URL of the stored model.
 */
export async function downloadAndStoreModel(
  modelUrl: string,
  dishId: string,
  format: 'glb' | 'usdz' = 'glb'
): Promise<string> {
  if (!modelUrl || typeof modelUrl !== 'string' || modelUrl.trim() === '') {
    return '/models/cheese-bacon-burger.glb';
  }

  // If already a local bundled model, return directly
  if (modelUrl.startsWith('/models/') || modelUrl.startsWith('./models/')) {
    return modelUrl;
  }

  if (!isSupabaseConfigured()) {
    // In demo mode, return the URL directly or a fallback
    return modelUrl || '/models/cheese-bacon-burger.glb';
  }

  try {
    // Download from Tripo CDN
    const response = await fetch(modelUrl);
    if (!response.ok) throw new Error(`Failed to download model: ${response.status}`);

    const blob = await response.blob();
    const timestamp = Date.now();
    const filePath = `${dishId}/model_${timestamp}.${format}`;

    // Upload to Supabase Storage (permanent)
    const { data, error } = await supabase.storage
      .from('dish-models')
      .upload(filePath, blob, {
        cacheControl: '86400',
        upsert: true,
        contentType: format === 'glb' ? 'model/gltf-binary' : 'application/octet-stream',
      });

    if (error) {
      console.warn('Supabase dish-models upload skipped/error:', error.message);
      return modelUrl;
    }

    // Get public URL (permanent)
    const { data: urlData } = supabase.storage
      .from('dish-models')
      .getPublicUrl(data.path);

    return urlData.publicUrl || modelUrl;
  } catch (err: any) {
    console.warn('downloadAndStoreModel warning, returning direct URL:', err.message);
    return modelUrl;
  }
}

// ---------------------------------------------------------------------------
// 5. Full Pipeline: Photos → 3D Model → Storage → URL
// ---------------------------------------------------------------------------

export interface PipelineCallbacks {
  onProgress: (progress: number, message: string) => void;
  onComplete: (glbUrl: string, usdzUrl?: string) => void;
  onError: (error: string) => void;
}

/**
 * Full pipeline that takes an image URL and returns a stored .glb URL.
 * Manages the entire lifecycle: create task → poll → download → store.
 */
export async function runFullPipeline(
  imageUrl: string,
  additionalUrls: string[],
  plateWidthCm: number,
  dishId: string,
  callbacks: PipelineCallbacks
): Promise<void> {
  try {
    // Step 1: Create task
    callbacks.onProgress(5, 'Enviando foto para a Tripo 3D AI...');
    const { taskId } = await createImageTo3DTask(imageUrl, additionalUrls, plateWidthCm);

    // Step 2: Poll until complete (Tripo recommends every 2s, max 1 req/s)
    let retries = 0;
    const maxRetries = 180; // 6 minutes max (180 * 2s)
    const pollInterval = 2000;

    const poll = async () => {
      while (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        retries++;

        try {
          const result = await pollTaskStatus(taskId);

          switch (result.status) {
            case 'queued':
              callbacks.onProgress(
                10 + Math.min(result.progress || 0, 5),
                'Aguardando na fila da Tripo 3D AI...'
              );
              break;

            case 'running':
              const progress = Math.min(15 + (result.progress || 0) * 0.7, 85);
              const messages = [
                'Analisando geometria e profundidade da imagem...',
                'Reconstruindo malha 3D do prato...',
                'Gerando texturas PBR e materiais realistas...',
                'Otimizando topologia para visualização AR...',
                'Finalizando modelo 3D...',
              ];
              const msgIndex = Math.min(
                Math.floor((result.progress || 0) / 20),
                messages.length - 1
              );
              callbacks.onProgress(progress, messages[msgIndex]);
              break;

            case 'success':
              callbacks.onProgress(90, 'Modelo 3D gerado! Armazenando arquivo .glb...');

              // Step 3: Download and store the model (URL expires in 5 min!)
              let glbUrl = '';
              if (result.model_url) {
                glbUrl = await downloadAndStoreModel(result.model_url, dishId, 'glb');
              }

              callbacks.onProgress(100, 'Modelo 3D pronto para aprovação!');
              callbacks.onComplete(glbUrl, '');
              return;

            case 'failed':
            case 'cancelled':
              callbacks.onError(
                result.error || 'A geração do modelo 3D falhou. Tente novamente com fotos diferentes.'
              );
              return;
          }
        } catch (pollErr: any) {
          console.warn('Poll iteration error:', pollErr.message);
          if (retries >= maxRetries) {
            callbacks.onError('Tempo limite excedido. A geração demorou mais que o esperado.');
            return;
          }
        }
      }

      callbacks.onError('Tempo limite excedido (6 minutos). Tente novamente.');
    };

    await poll();
  } catch (err: any) {
    callbacks.onError(err.message || 'Erro inesperado no pipeline de geração 3D.');
  }
}

// ---------------------------------------------------------------------------
// Simulation / Demo fallbacks (when no API key is configured)
// ---------------------------------------------------------------------------

const DEMO_MODELS = [
  '/models/cheese-bacon-burger.glb',
  '/models/pizza-pepperoni-grande.glb',
  '/models/salada-caesar.glb',
  '/models/combinados-35.glb',
  '/models/fettuccine-alfredo-camarao.glb',
  '/models/shishkebab.glb',
  '/models/fish.glb',
  '/models/avocado.glb',
  '/models/coffeemat.glb',
];

let simulationStep = 0;

function simulateCreateTask(): CreateTaskResponse {
  return { taskId: `demo-task-${Date.now()}` };
}

function simulatePollTask(taskId: string): TripoTaskResult {
  simulationStep++;

  if (simulationStep <= 2) {
    return {
      id: taskId,
      status: 'queued',
      progress: simulationStep * 10,
    };
  }
  if (simulationStep <= 6) {
    return {
      id: taskId,
      status: 'running',
      progress: 20 + (simulationStep - 2) * 20,
    };
  }

  // Done - pick a random model from the demo set
  simulationStep = 0;
  const randomModel = DEMO_MODELS[Math.floor(Math.random() * DEMO_MODELS.length)];
  return {
    id: taskId,
    status: 'success',
    progress: 100,
    model_url: randomModel,
  };
}

/**
 * Reset simulation state (call when starting a new generation)
 */
export function resetSimulation(): void {
  simulationStep = 0;
}

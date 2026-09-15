import { Dish } from './menu';

export type UserProfile = 'cliente' | 'garcom' | 'admin';

export type OrderStatus = 'pendente' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';

export interface OrderItem {
  dish: Dish;
  quantity: number;
  notes?: string;
}

export interface TableOrder {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  customerNotes?: string;
}

export type TableCallReason = 'Atendimento na Mesa' | 'Pedir a Conta' | 'Talheres, Taças ou Gelo';

export interface TableCall {
  id: string;
  tableNumber: string;
  reason: TableCallReason;
  status: 'aguardando' | 'atendido';
  createdAt: string;
}

export interface Collaborator {
  id: string;
  name: string;
  role: 'Garçom' | 'Chef de Cozinha' | 'Gerente' | 'Sommelier';
  phone: string;
  shift: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  status: 'ativo' | 'inativo';
  joinedAt: string;
}

export interface CollaboratorRequest {
  id: string;
  name: string;
  phone: string;
  role: 'Garçom' | 'Chef de Cozinha' | 'Gerente';
  notes?: string;
  requestedAt: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
}

export interface RestaurantSettings {
  name: string;
  subtitle: string;
  whatsappNumber: string;
  pixKey: string;
  totalTables: number;
  instagram: string;
}

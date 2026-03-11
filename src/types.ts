export interface User {
  id: number;
  username: string;
  email: string;
  rating: number;
  verified: number;
  avatar: string;
  role?: 'user' | 'admin';
  is_premium?: number;
  premium_until?: string;
}

export interface Item {
  id: number;
  user_id: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  estimated_value: number;
  wishlist: string;
  location: string;
  image_url: string;
  status: string;
  created_at: string;
  owner_name?: string;
  owner_avatar?: string;
  owner_rating?: number;
  is_premium?: number;
}

export interface Proposal {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender_item_ids: string; // JSON string
  receiver_item_id: number;
  cash_topup: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  meeting_point_id?: number;
  meeting_time?: string;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
  receiver_item_title?: string;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  type: 'public' | 'partner' | 'premium';
  description: string;
  image_url?: string;
}

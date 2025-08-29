import { Events } from "./event.model";


export interface EventsListResponse {
  events: Events[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface EventsListParams {
  page: number;
  size: number;
  status?: 'ALL' | 'DRAFT' | 'PUBLISHED';
  search?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

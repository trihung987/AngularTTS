import { BankInfo } from "./bank-info.model";
import { Organizer } from "./organizer.model";
import { Venue } from "./venue.model";
import { Zone } from "./zone.model";



/**
 * DTO chính chứa toàn bộ thông tin chi tiết của một sự kiện để hiển thị cho người dùng.
 */
export interface Events {
  id: string; // UUID của Java được chuyển thành 'string'
  eventName: string;
  eventImage: string; // URL đến ảnh
  eventBanner: string; // URL đến ảnh bìa
  eventCategory: string;
  eventDescription: string;
  ownerId?: string; // UUID của Java được chuyển thành 'string'
  ownerName?: string;
  venue: Venue;
  organizer: Organizer;
  startDate: string; // LocalDate của Java được chuyển thành 'string' (vd: "2025-08-25")
  endDate: string; // Tương tự LocalDate
  startTime: string; // LocalTime của Java được chuyển thành 'string' (vd: "23:06")
  endTime: string; // Tương tự LocalTime
  updatedDate: string;
  slug: string;
  timezone: string;
  zones: Zone[];
  bankInfo: BankInfo;
  eventStatus: 'DRAFT' | 'PUBLISHED';

  totalSeats: number;
  totalRevenue: number;
}

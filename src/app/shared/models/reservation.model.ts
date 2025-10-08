
// Tương ứng với HoldReservationRequest ở backend
export interface HoldReservationRequest {
  zoneId: number;
  quantity: number;
}

export interface Reservation {
  id: string;
  zoneId: string;
  nameZone: string;
  nameEvent: string;
  priceZone: number;
  ownerId: string;
  quantity: number;
  createdAt: string;
  expiresAt: string;
  status: "HOLD" | "PENDING_PAYMENT" | "CANCELED";
}

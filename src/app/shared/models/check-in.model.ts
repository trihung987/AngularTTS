export enum CheckInStatus {
  NOT_CHECKED_IN = 'NOT_CHECKED_IN',
  CHECKED_IN = 'CHECKED_IN',
}

export interface CheckIn {
  id: string;
  checkInCode: string;
  orderId: string;
  zoneId: string;
  zoneName: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  status: CheckInStatus;
  checkInTime: string | null;
  createdDate: string;
  updatedDate: string;
}


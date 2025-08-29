/**
 * DTO cho một khu vực (zone) trong sơ đồ chỗ ngồi.
 */
export interface Zone {
  id: number;
  name: string;
  color: string;
  price: number;
  shape: 'rectangle' | 'circle' | 'polygon' | 'ellipse' | 'triangle';
  isSellable?: boolean;
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    points?: { x: number; y: number }[];
  };
  maxTickets?: number;
  isSeatingZone?: boolean;
  description?: string;
  rotation: number; // <-- NEW: Add rotation property (in radians)
}

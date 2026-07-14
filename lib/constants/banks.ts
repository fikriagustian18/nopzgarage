// Daftar Bank Nasional Indonesia
export const INDONESIAN_BANKS = [
  { code: 'BCA', name: 'Bank Central Asia', color: '#003399' },
  { code: 'BNI', name: 'Bank Negara Indonesia', color: '#F97316' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia', color: '#1E40AF' },
  { code: 'MANDIRI', name: 'Bank Mandiri', color: '#003A70' },
  { code: 'BSI', name: 'Bank Syariah Indonesia', color: '#00A651' },
  { code: 'CIMB', name: 'CIMB Niaga', color: '#ED1C24' },
  { code: 'DANAMON', name: 'Bank Danamon', color: '#F5A623' },
  { code: 'PERMATA', name: 'Bank Permata', color: '#005BAC' },
  { code: 'OCBC', name: 'OCBC NISP', color: '#ED1B2F' },
  { code: 'MEGA', name: 'Bank Mega', color: '#003366' },
  { code: 'BTN', name: 'Bank Tabungan Negara', color: '#00529B' },
  { code: 'BTPN', name: 'Bank BTPN', color: '#003D7A' },
  { code: 'PANIN', name: 'Panin Bank', color: '#003366' },
  { code: 'MAYBANK', name: 'Maybank Indonesia', color: '#FFC72C' },
  { code: 'BUKOPIN', name: 'Bank Bukopin', color: '#003399' },
  { code: 'SINARMAS', name: 'Bank Sinarmas', color: '#ED1C24' },
  { code: 'JENIUS', name: 'Jenius (BTPN)', color: '#00B5CC' },
  { code: 'SEABANK', name: 'SeaBank Indonesia', color: '#0099FF' },
  { code: 'JAGO', name: 'Bank Jago', color: '#FFCC00' },
  { code: 'BNC', name: 'Bank Neo Commerce', color: '#6366F1' },
  { code: 'GOPAY', name: 'GoPay (E-Wallet)', color: '#00AED6' },
  { code: 'OVO', name: 'OVO (E-Wallet)', color: '#4C3494' },
  { code: 'DANA', name: 'DANA (E-Wallet)', color: '#118EEA' },
  { code: 'SHOPEEPAY', name: 'ShopeePay (E-Wallet)', color: '#EE4D2D' },
] as const;

export type BankCode = typeof INDONESIAN_BANKS[number]['code'];

export function getBankByCode(code: string) {
  return INDONESIAN_BANKS.find(b => b.code === code);
}

export function getBankColor(code: string) {
  return getBankByCode(code)?.color || '#6366F1';
}

export function getBankName(code: string) {
  return getBankByCode(code)?.name || code;
}

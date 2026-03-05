
export function calculateSessionAge(loginTime: Date | string | undefined): number {
  if (!loginTime) return 9999;
  const diffMs = Date.now() - new Date(loginTime).getTime();
  return Math.floor(diffMs / 1000 / 60);
}


export function getClientIp(request: any): string {
  return (
    request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    request.headers['x-real-ip'] ||
    request.connection?.remoteAddress ||
    request.socket?.remoteAddress ||
    'unknown'
  );
}
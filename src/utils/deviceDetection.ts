/**
 * Утилиты для определения типа устройства
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
}

/**
 * Определяет тип устройства на основе User Agent и размеров экрана
 */
export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  
  // Определяем мобильные устройства по User Agent
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const isMobileUA = mobileRegex.test(userAgent);
  
  // Определяем планшеты
  const tabletRegex = /ipad|android(?!.*mobile)|tablet/i;
  const isTabletUA = tabletRegex.test(userAgent);
  
  // Определяем по размеру экрана
  const isMobileScreen = screenWidth <= 768;
  const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;
  
  // Комбинируем проверки User Agent и размера экрана
  const isMobile = isMobileUA || (isMobileScreen && !isTabletUA);
  const isTablet = isTabletUA || (isTabletScreen && !isMobileUA);
  const isDesktop = !isMobile && !isTablet;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    userAgent,
    screenWidth,
    screenHeight
  };
}

/**
 * Проверяет, является ли устройство мобильным (включая планшеты)
 */
export function isMobileDevice(): boolean {
  const device = detectDevice();
  return device.isMobile || device.isTablet;
}

/**
 * Проверяет, является ли устройство десктопным
 */
export function isDesktopDevice(): boolean {
  const device = detectDevice();
  return device.isDesktop;
}

/**
 * Получает информацию об устройстве для отладки
 */
export function getDeviceInfo(): string {
  const device = detectDevice();
  return `Device Info:
    - User Agent: ${device.userAgent}
    - Screen: ${device.screenWidth}x${device.screenHeight}
    - Mobile: ${device.isMobile}
    - Tablet: ${device.isTablet}
    - Desktop: ${device.isDesktop}`;
}

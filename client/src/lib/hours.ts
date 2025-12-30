/**
 * @fileoverview Business hours parsing and open/closed status calculation
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Parses business hours strings and calculates real-time open/closed status
 * with time until opening for resources.
 * 
 * TIMEZONE HANDLING:
 * - Source of truth: Browser's IANA timezone database (America/Vancouver)
 * - Automatically handles DST transitions (PST ↔ PDT)
 * - Uses Intl.DateTimeFormat API for accurate timezone conversion
 * - DST changes: Second Sunday in March (spring forward) to first Sunday in November (fall back)
 * 
 * The browser's timezone database is updated via system updates and is the most
 * reliable source for timezone and DST information.
 */

export interface OpenStatus {
  isOpen: boolean;
  status: string;
  timeUntilOpen?: string;
  nextOpenTime?: string;
}

/**
 * Get current time in America/Vancouver timezone (PST/PDT)
 * Uses browser's IANA timezone database which automatically handles DST
 * Source of truth: Browser's timezone database (updated via system updates)
 * 
 * DST is automatically handled - America/Vancouver switches between:
 * - PST (UTC-8) in winter
 * - PDT (UTC-7) in summer (second Sunday in March to first Sunday in November)
 */
function getVancouverTime(): { dayNum: number; day: string; currentHour: number; currentMinute: number; currentMinutes: number } {
  const now = new Date();
  
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Vancouver',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Vancouver',
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const timeParts = timeFormatter.formatToParts(now);
  const hour = timeParts.find(p => p.type === 'hour')?.value || '0';
  const minute = timeParts.find(p => p.type === 'minute')?.value || '0';
  
  const dateParts = dateFormatter.formatToParts(now);
  const weekday = dateParts.find(p => p.type === 'weekday')?.value || '';
  const year = dateParts.find(p => p.type === 'year')?.value || '2025';
  const month = dateParts.find(p => p.type === 'month')?.value || '01';
  const day = dateParts.find(p => p.type === 'day')?.value || '01';
  
  const weekdayMap: Record<string, number> = {
    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
    'Thursday': 4, 'Friday': 5, 'Saturday': 6
  };
  const dayNum = weekdayMap[weekday] ?? 0;
  
  const currentHour = parseInt(hour, 10);
  const currentMinute = parseInt(minute, 10);
  const currentMinutes = currentHour * 60 + currentMinute;
  
  return {
    dayNum,
    day: weekday,
    currentHour,
    currentMinute,
    currentMinutes
  };
}

export function isOpenNow(hours: string | null | undefined): OpenStatus | null {
  if (!hours) return null;
  
  const { dayNum, day, currentHour, currentMinute, currentMinutes } = getVancouverTime();
  const hoursLower = hours.toLowerCase();
  
  if (hoursLower.includes('24/7') || hoursLower.includes('24 hours') || hoursLower.includes('always open')) {
    return { isOpen: true, status: 'Open 24/7' };
  }
  
  if (hoursLower.includes('temporarily closed') || hoursLower.includes('permanently closed')) {
    return { isOpen: false, status: 'Closed' };
  }
  
  if (hoursLower.includes('daily:') || hoursLower.includes('daily ')) {
    const breakfastMatch = hoursLower.match(/breakfast\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    const lunchMatch = hoursLower.match(/lunch\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    const dinnerMatch = hoursLower.match(/dinner\s+(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    
    if (breakfastMatch || lunchMatch || dinnerMatch) {
      return { isOpen: true, status: 'Open daily - see hours for meal times' };
    }
  }
  
  const dailyTimeMatch = hoursLower.match(/daily\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*[-–to]+\s*(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
  if (dailyTimeMatch) {
    let openHour = parseInt(dailyTimeMatch[1]);
    const openMin = parseInt(dailyTimeMatch[2] || '0');
    const openPeriod = dailyTimeMatch[3]?.toLowerCase();
    let closeHour = parseInt(dailyTimeMatch[4]);
    const closeMin = parseInt(dailyTimeMatch[5] || '0');
    const closePeriod = dailyTimeMatch[6]?.toLowerCase();
    
    // Convert to 24-hour format
    if (openPeriod === 'pm' && openHour !== 12) openHour += 12;
    if (openPeriod === 'am' && openHour === 12) openHour = 0;
    if (closePeriod === 'pm' && closeHour !== 12) closeHour += 12;
    if (closePeriod === 'am' && closeHour === 12) closeHour = 0;
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    const currentMinutes = currentHour * 60 + currentMinute;
    
    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      const minutesUntilClose = closeMinutes - currentMinutes;
      const hoursLeft = Math.floor(minutesUntilClose / 60);
      const minsLeft = minutesUntilClose % 60;
      
      if (minutesUntilClose <= 30) {
        return { isOpen: true, status: `Closes in ${minutesUntilClose} min` };
      } else if (hoursLeft <= 1) {
        return { isOpen: true, status: `Closes in ${minsLeft} min` };
      } else {
        return { isOpen: true, status: `Open for ${hoursLeft}h ${minsLeft > 0 ? minsLeft + 'm' : ''}`.trim() };
      }
    } else if (currentMinutes < openMinutes) {
      const minutesUntilOpen = openMinutes - currentMinutes;
      const hoursUntil = Math.floor(minutesUntilOpen / 60);
      const minsUntil = minutesUntilOpen % 60;
      
      let timeUntilOpen: string;
      if (hoursUntil === 0) {
        timeUntilOpen = `Opens in ${minsUntil} min`;
      } else if (hoursUntil === 1 && minsUntil === 0) {
        timeUntilOpen = 'Opens in 1 hour';
      } else {
        timeUntilOpen = `Opens in ${hoursUntil}h ${minsUntil > 0 ? minsUntil + 'm' : ''}`.trim();
      }
      
      return { 
        isOpen: false, 
        status: timeUntilOpen,
        timeUntilOpen,
        nextOpenTime: formatTime(openHour, openMin)
      };
    } else {
      return { 
        isOpen: false, 
        status: `Opens tomorrow at ${formatTime(openHour, openMin)}`,
        nextOpenTime: `Tomorrow at ${formatTime(openHour, openMin)}`
      };
    }
  }
  
  const timeRangeMatch = hoursLower.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*[-–to]+\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  
  if (timeRangeMatch) {
    let openHour = parseInt(timeRangeMatch[1], 10);
    const openMin = parseInt(timeRangeMatch[2] || '0', 10);
    const openPeriod = timeRangeMatch[3]?.toLowerCase();
    let closeHour = parseInt(timeRangeMatch[4], 10);
    const closeMin = parseInt(timeRangeMatch[5] || '0', 10);
    const closePeriod = timeRangeMatch[6]?.toLowerCase();
    
    if (isNaN(openHour) || isNaN(closeHour) || openHour < 1 || openHour > 12 || closeHour < 1 || closeHour > 12) {
      return null;
    }
    
    if (openPeriod === 'pm' && openHour !== 12) openHour += 12;
    if (openPeriod === 'am' && openHour === 12) openHour = 0;
    if (closePeriod === 'pm' && closeHour !== 12) closeHour += 12;
    if (closePeriod === 'am' && closeHour === 12) closeHour = 0;
    
    if (openHour < 0 || openHour > 23 || closeHour < 0 || closeHour > 23) {
      return null;
    }
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    const isWeekday = dayNum >= 1 && dayNum <= 5;
    const isWeekend = dayNum === 0 || dayNum === 6;
    
    const matchesDay = 
      hoursLower.includes(day.toLowerCase()) ||
      (hoursLower.includes('mon-fri') && isWeekday) ||
      (hoursLower.includes('monday-friday') && isWeekday) ||
      (hoursLower.includes('weekday') && isWeekday) ||
      (hoursLower.includes('sat') && dayNum === 6) ||
      (hoursLower.includes('sun') && dayNum === 0) ||
      (!hoursLower.includes('mon') && !hoursLower.includes('tue') && !hoursLower.includes('wed') && 
       !hoursLower.includes('thu') && !hoursLower.includes('fri') && !hoursLower.includes('sat') && 
       !hoursLower.includes('sun') && !hoursLower.includes('weekday') && !hoursLower.includes('weekend'));
    
    if (matchesDay) {
      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        const minutesUntilClose = closeMinutes - currentMinutes;
        const hoursLeft = Math.floor(minutesUntilClose / 60);
        const minsLeft = minutesUntilClose % 60;
        
        if (minutesUntilClose <= 30) {
          return { isOpen: true, status: `Closes in ${minutesUntilClose} min` };
        } else if (hoursLeft === 1 && minsLeft === 0) {
          return { isOpen: true, status: 'Closes in 1 hour' };
        } else if (hoursLeft === 1) {
          return { isOpen: true, status: `Closes in 1h ${minsLeft}m` };
        } else if (hoursLeft > 1) {
          return { isOpen: true, status: `Open for ${hoursLeft}h${minsLeft > 0 ? ` ${minsLeft}m` : ''}`.trim() };
        } else {
          // Less than 1 hour left
          return { isOpen: true, status: `Closes in ${minsLeft} min` };
        }
      } 
      // Opens later today
      else if (currentMinutes < openMinutes) {
        const minutesUntilOpen = openMinutes - currentMinutes;
        const hoursUntil = Math.floor(minutesUntilOpen / 60);
        const minsUntil = minutesUntilOpen % 60;
        
        let timeUntilOpen: string;
        if (hoursUntil === 0) {
          timeUntilOpen = `Opens in ${minsUntil} min`;
        } else if (hoursUntil === 1 && minsUntil === 0) {
          timeUntilOpen = 'Opens in 1 hour';
        } else {
          timeUntilOpen = `Opens in ${hoursUntil}h ${minsUntil > 0 ? minsUntil + 'm' : ''}`.trim();
        }
        
        return { 
          isOpen: false, 
          status: timeUntilOpen,
          timeUntilOpen,
          nextOpenTime: formatTime(openHour, openMin)
        };
      } 
      // Closed for today - check if it opens tomorrow
      else {
        // Check if it's a weekday/weekend pattern
        if (hoursLower.includes('mon-fri') || hoursLower.includes('monday-friday') || hoursLower.includes('weekday')) {
          if (isWeekend) {
            // Next weekday
            const daysUntilMonday = dayNum === 0 ? 1 : (8 - dayNum);
            return { 
              isOpen: false, 
              status: `Opens ${daysUntilMonday === 1 ? 'tomorrow' : `in ${daysUntilMonday} days`} at ${formatTime(openHour, openMin)}`,
              nextOpenTime: `Monday at ${formatTime(openHour, openMin)}`
            };
          } else {
            return { 
              isOpen: false, 
              status: `Opens tomorrow at ${formatTime(openHour, openMin)}`,
              nextOpenTime: `Tomorrow at ${formatTime(openHour, openMin)}`
            };
          }
        }
        
        return { 
          isOpen: false, 
          status: `Opens tomorrow at ${formatTime(openHour, openMin)}`,
          nextOpenTime: `Tomorrow at ${formatTime(openHour, openMin)}`
        };
      }
    }
  }
  
  if (hoursLower.includes('mon-fri') || hoursLower.includes('monday-friday') || hoursLower.includes('weekday')) {
    if (dayNum >= 1 && dayNum <= 5) {
      return { isOpen: true, status: 'Open weekdays' };
    }
    const daysUntilMonday = dayNum === 0 ? 1 : (8 - dayNum);
    return { 
      isOpen: false, 
      status: `Opens ${daysUntilMonday === 1 ? 'tomorrow' : `in ${daysUntilMonday} days`}`,
      nextOpenTime: 'Monday'
    };
  }
  
  return null;
}

function formatTime(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMin = minute > 0 ? `:${minute.toString().padStart(2, '0')}` : '';
  return `${displayHour}${displayMin} ${period}`;
}

export function sortByOpenStatus<T extends { hours?: string | null }>(resources: T[]): T[] {
  return [...resources].sort((a, b) => {
    const statusA = isOpenNow(a.hours);
    const statusB = isOpenNow(b.hours);
    
    // Priority 1: Open resources first
    const aOpen = statusA?.isOpen ?? false;
    const bOpen = statusB?.isOpen ?? false;
    
    if (aOpen && !bOpen) return -1;
    if (!aOpen && bOpen) return 1;
    
    // Priority 2: If both closed, prioritize ones with known hours (showing time until open)
    if (!aOpen && !bOpen) {
      if (statusA && !statusB) return -1;
      if (!statusA && statusB) return 1;
    }
    
    // Priority 3: Resources with hours info before those without
    const aHasHours = statusA !== null;
    const bHasHours = statusB !== null;
    if (aHasHours && !bHasHours) return -1;
    if (!aHasHours && bHasHours) return 1;
    
    return 0;
  });
}

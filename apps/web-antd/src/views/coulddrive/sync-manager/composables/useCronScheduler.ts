import type { Ref } from 'vue';

import { computed } from 'vue';

export interface CronFormLike {
  cron_display: string;
  cron: string;
  cron_type: string;
  cron_value: number;
  cron_hour: number;
  cron_minute: number;
  cron_weekday: number;
  cron_day: number;
}

export function useCronScheduler(formData: Ref<CronFormLike>) {
  const needsValueInput = computed(() => {
    return ['n_days', 'n_hours', 'n_minutes', 'n_seconds'].includes(
      formData.value.cron_type,
    );
  });

  const needsTimeInput = computed(() => {
    return ['daily', 'monthly', 'n_days', 'weekly'].includes(
      formData.value.cron_type,
    );
  });

  const needsWeekdayInput = computed(() => {
    return formData.value.cron_type === 'weekly';
  });

  const needsDayInput = computed(() => {
    return formData.value.cron_type === 'monthly';
  });

  function getMaxValue() {
    switch (formData.value.cron_type) {
      case 'n_days': {
        return 365;
      }
      case 'n_hours': {
        return 23;
      }
      case 'n_minutes': {
        return 59;
      }
      case 'n_seconds': {
        return 59;
      }
      default: {
        return 100;
      }
    }
  }

  function getUnitText() {
    switch (formData.value.cron_type) {
      case 'n_days': {
        return '天';
      }
      case 'n_hours': {
        return '小时';
      }
      case 'n_minutes': {
        return '分钟';
      }
      case 'n_seconds': {
        return '秒';
      }
      default: {
        return '';
      }
    }
  }

  function getWeekdayText(weekday: number): string {
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return weekdays[weekday - 1] || '周一';
  }

  function parseCronExpression(cronExpr: string) {
    if (!cronExpr || cronExpr.trim() === '') {
      formData.value.cron_type = '';
      formData.value.cron_display = '手动执行';
      return;
    }

    const parts = cronExpr.trim().split(/\s+/);

    try {
      if (parts.length === 5) {
        const [minute, hour, day, month, weekday] = parts as [
          string,
          string,
          string,
          string,
          string,
        ];

        if (
          day === '*' &&
          month === '*' &&
          weekday === '*' &&
          !minute.includes('/') &&
          !hour.includes('/')
        ) {
          formData.value.cron_type = 'daily';
          formData.value.cron_hour = Number.parseInt(hour);
          formData.value.cron_minute = Number.parseInt(minute);
          formData.value.cron_display = `每天${hour.padStart(2, '0')}:${minute.padStart(2, '0')}执行`;
          return;
        }

        if (day.includes('/') && month === '*' && weekday === '*') {
          const dayMatch = day.match(/^\*\/(\d+)$/);
          const dayValue = dayMatch?.[1];
          if (dayValue) {
            formData.value.cron_type = 'n_days';
            formData.value.cron_value = Number.parseInt(dayValue);
            formData.value.cron_hour = Number.parseInt(hour);
            formData.value.cron_minute = Number.parseInt(minute);
            formData.value.cron_display = `每${dayValue}天${hour.padStart(2, '0')}:${minute.padStart(2, '0')}执行`;
            return;
          }
        }

        if (
          minute === '0' &&
          hour === '*' &&
          day === '*' &&
          month === '*' &&
          weekday === '*'
        ) {
          formData.value.cron_type = 'hourly';
          formData.value.cron_display = '每小时执行';
          return;
        }

        if (
          minute === '0' &&
          hour.includes('/') &&
          day === '*' &&
          month === '*' &&
          weekday === '*'
        ) {
          const hourMatch = hour.match(/^\*\/(\d+)$/);
          const hourValue = hourMatch?.[1];
          if (hourValue) {
            formData.value.cron_type = 'n_hours';
            formData.value.cron_value = Number.parseInt(hourValue);
            formData.value.cron_display = `每${hourValue}小时执行`;
            return;
          }
        }

        if (
          minute.includes('/') &&
          hour === '*' &&
          day === '*' &&
          month === '*' &&
          weekday === '*'
        ) {
          const minuteMatch = minute.match(/^\*\/(\d+)$/);
          const minuteValue = minuteMatch?.[1];
          if (minuteValue) {
            formData.value.cron_type = 'n_minutes';
            formData.value.cron_value = Number.parseInt(minuteValue);
            formData.value.cron_display = `每${minuteValue}分钟执行`;
            return;
          }
        }

        if (
          day === '*' &&
          month === '*' &&
          !weekday.includes('*') &&
          !minute.includes('/') &&
          !hour.includes('/')
        ) {
          formData.value.cron_type = 'weekly';
          formData.value.cron_hour = Number.parseInt(hour);
          formData.value.cron_minute = Number.parseInt(minute);
          formData.value.cron_weekday = Number.parseInt(weekday);
          const weekdayText = getWeekdayText(Number.parseInt(weekday));
          formData.value.cron_display = `每${weekdayText}${hour.padStart(2, '0')}:${minute.padStart(2, '0')}执行`;
          return;
        }

        if (
          !day.includes('*') &&
          month === '*' &&
          weekday === '*' &&
          !minute.includes('/') &&
          !hour.includes('/')
        ) {
          formData.value.cron_type = 'monthly';
          formData.value.cron_hour = Number.parseInt(hour);
          formData.value.cron_minute = Number.parseInt(minute);
          formData.value.cron_day = Number.parseInt(day);
          formData.value.cron_display = `每月${day}号${hour.padStart(2, '0')}:${minute.padStart(2, '0')}执行`;
          return;
        }
      } else if (parts.length === 6) {
        const [second, minute, hour, day, month, weekday] = parts as [
          string,
          string,
          string,
          string,
          string,
          string,
        ];

        if (
          second.includes('/') &&
          minute === '*' &&
          hour === '*' &&
          day === '*' &&
          month === '*' &&
          weekday === '*'
        ) {
          const secondMatch = second.match(/^\*\/(\d+)$/);
          const secondValue = secondMatch?.[1];
          if (secondValue) {
            formData.value.cron_type = 'n_seconds';
            formData.value.cron_value = Number.parseInt(secondValue);
            formData.value.cron_display = `每${secondValue}秒执行`;
            return;
          }
        }
      }

      formData.value.cron_type = '';
      formData.value.cron_display = `自定义: ${cronExpr}`;
    } catch {
      formData.value.cron_type = '';
      formData.value.cron_display = `自定义: ${cronExpr}`;
    }
  }

  function updateCronExpression() {
    const type = formData.value.cron_type;
    const value = formData.value.cron_value;
    const hour = formData.value.cron_hour;
    const minute = formData.value.cron_minute;
    const weekday = formData.value.cron_weekday;
    const day = formData.value.cron_day;

    switch (type) {
      case '': {
        formData.value.cron = '';
        formData.value.cron_display = '手动执行';
        break;
      }
      case 'daily': {
        formData.value.cron = `${minute} ${hour} * * *`;
        formData.value.cron_display = `每天${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}执行`;
        break;
      }
      case 'hourly': {
        formData.value.cron = '0 * * * *';
        formData.value.cron_display = '每小时执行';
        break;
      }
      case 'monthly': {
        formData.value.cron = `${minute} ${hour} ${day} * *`;
        formData.value.cron_display = `每月${day}号${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}执行`;
        break;
      }
      case 'n_days': {
        formData.value.cron = `${minute} ${hour} */${value} * *`;
        formData.value.cron_display = `每${value}天${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}执行`;
        break;
      }
      case 'n_hours': {
        formData.value.cron = `0 */${value} * * *`;
        formData.value.cron_display = `每${value}小时执行`;
        break;
      }
      case 'n_minutes': {
        formData.value.cron = `*/${value} * * * *`;
        formData.value.cron_display = `每${value}分钟执行`;
        break;
      }
      case 'n_seconds': {
        formData.value.cron = `*/${value} * * * * *`;
        formData.value.cron_display = `每${value}秒执行`;
        break;
      }
      case 'weekly': {
        formData.value.cron = `${minute} ${hour} * * ${weekday}`;
        formData.value.cron_display = `每${getWeekdayText(weekday)}${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}执行`;
        break;
      }
      default: {
        formData.value.cron = '';
        formData.value.cron_display = '';
      }
    }
  }

  return {
    needsValueInput,
    needsTimeInput,
    needsWeekdayInput,
    needsDayInput,
    getMaxValue,
    getUnitText,
    parseCronExpression,
    updateCronExpression,
  };
}

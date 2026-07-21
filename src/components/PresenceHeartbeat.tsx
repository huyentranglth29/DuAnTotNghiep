import {useEffect} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {sendAuthHeartbeat} from '../services/voucherService';

const HEARTBEAT_MS = 30 * 1000;

/**
 * Gửi heartbeat định kỳ khi app đang foreground để Admin thấy user online.
 */
function PresenceHeartbeat() {
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let alive = true;

    const ping = async () => {
      try {
        await sendAuthHeartbeat();
      } catch {
        // Token hết hạn / mất mạng — bỏ qua
      }
    };

    const start = () => {
      if (timer) return;
      ping();
      timer = setInterval(ping, HEARTBEAT_MS);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onState = (nextState: AppStateStatus) => {
      if (!alive) return;
      if (nextState === 'active') {
        start();
      } else {
        stop();
      }
    };

    if (AppState.currentState === 'active') {
      start();
    }

    const sub = AppState.addEventListener('change', onState);
    return () => {
      alive = false;
      stop();
      sub.remove();
    };
  }, []);

  return null;
}

export default PresenceHeartbeat;

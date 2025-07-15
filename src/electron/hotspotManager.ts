import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Interface for hotspot status
interface HotspotStatus {
  isEnabled: boolean;
  ssid?: string;
  error?: string;
}

/**
 * Check if the device's hotspot is enabled
 * @returns Promise<HotspotStatus> - The status of the hotspot
 */
export async function checkHotspotStatus(): Promise<HotspotStatus> {
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      // Windows implementation
      const { stdout } = await execAsync('netsh wlan show hostednetwork');
      const isEnabled = stdout.includes('Status                 : Started');
      const ssidMatch = stdout.match(/SSID name\s+: "(.+?)"/);
      const ssid = ssidMatch ? ssidMatch[1] : undefined;

      return { isEnabled, ssid };
    } else if (platform === 'darwin') {
      // macOS implementation
      const { stdout } = await execAsync('networksetup -getairportpower en0');
      const isEnabled = stdout.includes('On');

      // Get SSID if enabled
      let ssid;
      if (isEnabled) {
        const { stdout: ssidStdout } = await execAsync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep " SSID"');
        const ssidMatch = ssidStdout.match(/SSID: (.+)/);
        ssid = ssidMatch ? ssidMatch[1] : undefined;
      }

      return { isEnabled, ssid };
    } else if (platform === 'linux') {
      // Linux implementation
      const { stdout } = await execAsync('nmcli radio wifi');
      const isEnabled = stdout.trim() === 'enabled';

      // Get SSID if enabled
      let ssid;
      if (isEnabled) {
        const { stdout: ssidStdout } = await execAsync('nmcli -t -f active,ssid dev wifi | grep "^yes"');
        const ssidMatch = ssidStdout.match(/yes:(.+)/);
        ssid = ssidMatch ? ssidMatch[1] : undefined;
      }

      return { isEnabled, ssid };
    } else {
      return { 
        isEnabled: false, 
        error: `Unsupported platform: ${platform}` 
      };
    }
  } catch (error) {
    return { 
      isEnabled: false, 
      error: `Error checking hotspot status: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Enable the device's hotspot
 * @param ssid - The SSID (network name) for the hotspot
 * @param password - The password for the hotspot
 * @returns Promise<boolean> - Whether the operation was successful
 */
export async function enableHotspot(ssid: string, password: string): Promise<boolean> {
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      // Windows implementation
      // First, set up the hosted network
      await execAsync(`netsh wlan set hostednetwork mode=allow ssid="${ssid}" key="${password}"`);
      // Then start it
      await execAsync('netsh wlan start hostednetwork');
      return true;
    } else if (platform === 'darwin') {
      // macOS implementation
      // Turn on Wi-Fi if it's off
      await execAsync('networksetup -setairportpower en0 on');

      // Create a personal hotspot (this is more complex on macOS and might require additional permissions)
      // This is a simplified version and might not work on all macOS versions
      await execAsync(`networksetup -createnetworkservice "${ssid}" en0`);
      await execAsync(`networksetup -setnetworkserviceenabled "${ssid}" on`);

      return true;
    } else if (platform === 'linux') {
      // Linux implementation using NetworkManager
      // Create a new hotspot connection
      await execAsync(`nmcli device wifi hotspot ifname wlan0 ssid "${ssid}" password "${password}"`);
      return true;
    } else {
      console.error(`Unsupported platform: ${platform}`);
      return false;
    }
  } catch (error) {
    console.error(`Error enabling hotspot: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

/**
 * Disable the device's hotspot
 * @returns Promise<boolean> - Whether the operation was successful
 */
export async function disableHotspot(): Promise<boolean> {
  const platform = os.platform();

  try {
    if (platform === 'win32') {
      // Windows implementation
      await execAsync('netsh wlan stop hostednetwork');
      return true;
    } else if (platform === 'darwin') {
      // macOS implementation - this doesn't actually disable the hotspot, just turns off Wi-Fi
      // A more complete implementation would require additional permissions and APIs
      await execAsync('networksetup -setairportpower en0 off');
      return true;
    } else if (platform === 'linux') {
      // Linux implementation
      // Find and stop the hotspot connection
      const { stdout } = await execAsync('nmcli -t -f uuid,type con show | grep wifi-hotspot');
      if (stdout) {
        const uuid = stdout.split(':')[0];
        await execAsync(`nmcli con down uuid ${uuid}`);
      }
      return true;
    } else {
      console.error(`Unsupported platform: ${platform}`);
      return false;
    }
  } catch (error) {
    console.error(`Error disabling hotspot: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

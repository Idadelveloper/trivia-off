import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Interface for network status
export interface NetworkStatus {
  isConnected: boolean;
  ssid?: string;
  ipAddress?: string;
  hostname?: string;
  error?: string;
}

/**
 * Get the current network status including Wi-Fi SSID and IP address
 * @returns Promise<NetworkStatus> - The status of the network connection
 */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  const platform = os.platform();

  try {
    // Get IP address (works on all platforms)
    const networkInterfaces = os.networkInterfaces();
    let ipAddress: string | undefined;

    // Find the first non-internal IPv4 address
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        for (const iface of interfaces) {
          // Skip internal and non-IPv4 addresses
          if (!iface.internal && iface.family === 'IPv4') {
            ipAddress = iface.address;
            break;
          }
        }
      }
      if (ipAddress) break;
    }

    // If we found an IP address, we're connected to some network
    // This handles cases where we might be connected via Ethernet or other non-WiFi networks
    const hasNetworkConnection = !!ipAddress;

    // Get Wi-Fi SSID based on platform
    let ssid: string | undefined;
    let wifiConnected = false;

    if (platform === 'win32') {
      // Windows implementation
      try {
        const { stdout } = await execAsync('netsh wlan show interfaces');
        const ssidMatch = stdout.match(/SSID\s+: (.+)/);
        ssid = ssidMatch ? ssidMatch[1] : undefined;
        wifiConnected = !!ssid;
      } catch (error) {
        // If the command fails, Wi-Fi might be off or not connected
        wifiConnected = false;
      }
    } else if (platform === 'darwin') {
      // macOS implementation
      try {
        const { stdout } = await execAsync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep " SSID"');
        const ssidMatch = stdout.match(/SSID: (.+)/);
        ssid = ssidMatch ? ssidMatch[1] : undefined;
        wifiConnected = !!ssid;
      } catch (error) {
        // If the command fails, Wi-Fi might be off or not connected
        wifiConnected = false;
      }
    } else if (platform === 'linux') {
      // Linux implementation
      try {
        const { stdout } = await execAsync('nmcli -t -f active,ssid dev wifi | grep "^yes"');
        const ssidMatch = stdout.match(/yes:(.+)/);
        ssid = ssidMatch ? ssidMatch[1] : undefined;
        wifiConnected = !!ssid;
      } catch (error) {
        // If the command fails, Wi-Fi might be off or not connected
        wifiConnected = false;
      }
    }

    // We're connected if either we have a WiFi connection or any network interface with an IP
    const isConnected = wifiConnected || hasNetworkConnection;

    // Get the hostname of the machine
    const hostname = os.hostname();

    return { 
      isConnected, 
      ssid, 
      ipAddress,
      hostname
    };
  } catch (error) {
    return { 
      isConnected: false, 
      error: `Error getting network status: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

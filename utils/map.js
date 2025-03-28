/**
 * 地图工具类
 */

// 高德地图相关API KEY
const MAP_KEY = ''; // 请替换为您的高德地图 API KEY

/**
 * 获取当前位置
 * @returns {Promise} 返回Promise对象，成功时返回位置信息
 */
export function getLocation() {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      success: res => {
        resolve(res);
      },
      fail: err => {
        console.error('获取位置失败', err);
        reject(err);
      }
    });
  });
}

/**
 * 打开地图选择位置
 * @returns {Promise} 返回Promise对象，成功时返回选择的位置信息
 */
export function chooseLocation() {
  return new Promise((resolve, reject) => {
    uni.chooseLocation({
      success: res => {
        if (res.name && res.address) {
          resolve({
            name: res.name,
            address: res.address,
            latitude: res.latitude,
            longitude: res.longitude
          });
        } else {
          reject(new Error('未选择有效位置'));
        }
      },
      fail: err => {
        console.error('选择位置失败', err);
        reject(err);
      }
    });
  });
}

/**
 * 打开地图并显示标记点
 * @param {Array} markers 标记点数组，包含name, latitude, longitude
 */
export function openMapWithMarkers(markers = []) {
  if (!markers.length) return;
  
  // 计算中心点
  const avgLat = markers.reduce((sum, marker) => sum + marker.latitude, 0) / markers.length;
  const avgLng = markers.reduce((sum, marker) => sum + marker.longitude, 0) / markers.length;
  
  uni.openLocation({
    latitude: markers[0].latitude,
    longitude: markers[0].longitude,
    name: markers[0].name,
    address: markers[0].address || '',
    scale: 14
  });
}

/**
 * 跳转到地图页面显示多个标记点
 * @param {Array} markers 标记点数组
 */
export function navigateToMapPage(markers = []) {
  if (!markers.length) return;
  
  uni.navigateTo({
    url: '/pages/map/map?markers=' + encodeURIComponent(JSON.stringify(markers))
  });
}
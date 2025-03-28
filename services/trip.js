/**
 * 行程管理服务
 */

// 本地存储键名
const TRIP_STORAGE_KEY = 'trip_data';

/**
 * 获取所有行程数据
 * @returns {Array} 行程数组
 */
export function getAllTrips() {
  try {
    const tripData = uni.getStorageSync(TRIP_STORAGE_KEY);
    return tripData ? JSON.parse(tripData) : [];
  } catch (e) {
    console.error('获取行程数据失败', e);
    return [];
  }
}

/**
 * 保存所有行程数据
 * @param {Array} trips 行程数组
 */
export function saveAllTrips(trips) {
  try {
    uni.setStorageSync(TRIP_STORAGE_KEY, JSON.stringify(trips));
    return true;
  } catch (e) {
    console.error('保存行程数据失败', e);
    return false;
  }
}

/**
 * 获取行程详情
 * @param {String} tripId 行程ID
 * @returns {Object|null} 行程对象或null
 */
export function getTripById(tripId) {
  const trips = getAllTrips();
  return trips.find(trip => trip.id === tripId) || null;
}

/**
 * 添加新行程
 * @param {Object} trip 行程对象
 * @returns {Boolean} 是否成功
 */
export function addTrip(trip) {
  const trips = getAllTrips();
  // 生成唯一ID
  trip.id = Date.now().toString();
  trips.push(trip);
  return saveAllTrips(trips);
}

/**
 * 更新行程
 * @param {Object} updatedTrip 更新后的行程对象
 * @returns {Boolean} 是否成功
 */
export function updateTrip(updatedTrip) {
  const trips = getAllTrips();
  const index = trips.findIndex(trip => trip.id === updatedTrip.id);
  
  if (index > -1) {
    trips[index] = updatedTrip;
    return saveAllTrips(trips);
  }
  
  return false;
}

/**
 * 删除行程
 * @param {String} tripId 行程ID
 * @returns {Boolean} 是否成功
 */
export function deleteTrip(tripId) {
  const trips = getAllTrips();
  const filteredTrips = trips.filter(trip => trip.id !== tripId);
  
  if (filteredTrips.length < trips.length) {
    return saveAllTrips(filteredTrips);
  }
  
  return false;
}

/**
 * 添加地点到行程的某一天
 * @param {String} tripId 行程ID
 * @param {Number} dayIndex 天数索引
 * @param {Object} location 地点对象
 * @returns {Boolean} 是否成功
 */
export function addLocationToTripDay(tripId, dayIndex, location) {
  const trip = getTripById(tripId);
  
  if (!trip) return false;
  
  // 确保days数组存在
  if (!trip.days) {
    trip.days = [];
  }
  
  // 确保指定天数的数组存在
  if (!trip.days[dayIndex]) {
    trip.days[dayIndex] = {
      dayIndex: dayIndex,
      date: new Date(new Date(trip.startDate).getTime() + dayIndex * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      locations: []
    };
  }
  
  // 添加位置到指定天
  trip.days[dayIndex].locations.push({
    ...location,
    id: Date.now().toString() // 为位置生成唯一ID
  });
  
  return updateTrip(trip);
}

/**
 * 从行程的某天中移除地点
 * @param {String} tripId 行程ID
 * @param {Number} dayIndex 天数索引
 * @param {String} locationId 地点ID
 * @returns {Boolean} 是否成功
 */
export function removeLocationFromTripDay(tripId, dayIndex, locationId) {
  const trip = getTripById(tripId);
  
  if (!trip || !trip.days || !trip.days[dayIndex]) return false;
  
  const day = trip.days[dayIndex];
  day.locations = day.locations.filter(loc => loc.id !== locationId);
  
  return updateTrip(trip);
}
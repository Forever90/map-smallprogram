<template>
  <view class="container">
    <view v-if="!trip" class="loading">
      <text>加载中...</text>
    </view>
    
    <block v-else>
      <view class="header">
        <view class="title">{{ trip.name }}</view>
        <view class="date">{{ formatDateRange(trip.startDate, trip.duration) }}</view>
      </view>
      
      <view class="actions">
        <button type="primary" size="mini" @tap="addLocation">添加地点</button>
        <button type="default" size="mini" @tap="viewAllOnMap">在地图中查看</button>
      </view>
      
      <view class="days-container">
        <view v-if="!trip.days || trip.days.length === 0" class="empty-tip">
          <text>暂无行程安排，点击"添加地点"按钮添加</text>
        </view>
        
        <view v-else class="days-list">
          <view 
            v-for="(day, dayIndex) in trip.days" 
            :key="dayIndex"
            class="day-item"
          >
            <view class="day-header">
              <text class="day-title">第{{ dayIndex + 1 }}天</text>
              <text class="day-date">{{ formatDate(day.date) }}</text>
            </view>
            
            <view v-if="!day.locations || day.locations.length === 0" class="day-empty">
              <text>暂无地点</text>
            </view>
            
            <view v-else class="locations-list">
              <view 
                v-for="(location, locationIndex) in day.locations" 
                :key="location.id"
                class="location-item"
              >
                <view class="location-order">{{ locationIndex + 1 }}</view>
                <view class="location-info" @tap="showLocationOnMap(location)">
                  <view class="location-name">{{ location.name }}</view>
                  <view class="location-address">{{ location.address }}</view>
                </view>
                <view class="location-actions">
                  <button 
                    type="warn" 
                    size="mini" 
                    @tap="removeLocation(dayIndex, location.id)"
                  >删除</button>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </block>
  </view>
</template>

<script>
import { getTripById, removeLocationFromTripDay } from '../../services/trip.js';
import { navigateToMapPage } from '../../utils/map.js';

export default {
  data() {
    return {
      tripId: '',
      trip: null
    };
  },
  onLoad(options) {
    if (options.id) {
      this.tripId = options.id;
      this.loadTripDetail();
    } else {
      uni.showToast({
        title: '缺少行程ID',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  // 每次页面显示时重新加载数据
  onShow() {
    if (this.tripId) {
      this.loadTripDetail();
    }
  },
  methods: {
    // 加载行程详情
    loadTripDetail() {
      const trip = getTripById(this.tripId);
      
      if (trip) {
        this.trip = trip;
      } else {
        uni.showToast({
          title: '未找到行程',
          icon: 'none'
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      }
    },
    
    // 添加地点
    addLocation() {
		const externoptions = {
			"addToTrip": true
		};
		uni.setStorageSync("externoptions", externoptions);
		console.log("addLocation", externoptions);
		uni.switchTab({
			url: `/pages/map/map`
		});
    },
    
    // 从行程中移除地点
    removeLocation(dayIndex, locationId) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除该地点吗？',
        success: res => {
          if (res.confirm) {
            const success = removeLocationFromTripDay(this.tripId, dayIndex, locationId);
            
            if (success) {
              uni.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadTripDetail();
            } else {
              uni.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 在地图上查看单个位置
    showLocationOnMap(location) {
      uni.openLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name,
        address: location.address || '',
        scale: 18
      });
    },
    
    // 在地图上查看所有位置
    viewAllOnMap() {
      if (!this.trip || !this.trip.days) return;
      
      // 收集所有地点
      const allLocations = [];
      
      this.trip.days.forEach(day => {
        if (day.locations && day.locations.length > 0) {
          allLocations.push(...day.locations);
        }
      });
      
      if (allLocations.length === 0) {
        uni.showToast({
          title: '暂无地点',
          icon: 'none'
        });
        return;
      }
      
      // 跳转到地图页面并传递所有地点信息
      navigateToMapPage(allLocations);
    },
    
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '';
      
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
      
      return `${month}月${day}日 ${weekday}`;
    },
    
    // 格式化日期范围
    formatDateRange(startDate, duration) {
      if (!startDate) return '';
      
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + duration - 1);
      
      const startMonth = start.getMonth() + 1;
      const startDay = start.getDate();
      const endMonth = end.getMonth() + 1;
      const endDay = end.getDate();
      
      return `${startMonth}月${startDay}日 - ${endMonth}月${endDay}日 (${duration}天)`;
    }
  }
};
</script>

<style>
.container {
  padding: 30rpx;
}

.loading,
.empty-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;
  color: #999;
}

.header {
  margin-bottom: 30rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.date {
  font-size: 28rpx;
  color: #666;
}

.actions {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.days-container {
  margin-top: 20rpx;
}

.day-item {
  margin-bottom: 30rpx;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #eee;
  margin-bottom: 16rpx;
}

.day-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.day-date {
  font-size: 24rpx;
  color: #666;
}

.day-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100rpx;
  color: #999;
}

.location-item {
  display: flex;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.location-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.location-order {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60rpx;
  height: 60rpx;
  background-color: #3cc51f;
  color: white;
  border-radius: 50%;
  font-size: 24rpx;
  margin-right: 20rpx;
}

.location-info {
  flex: 1;
}

.location-name {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 6rpx;
}

.location-address {
  font-size: 24rpx;
  color: #999;
}

.location-actions {
  display: flex;
  align-items: center;
}
</style> 
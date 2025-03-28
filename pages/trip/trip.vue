<template>
  <view class="container">
    <view class="header">
      <view class="title">我的行程</view>
      <button class="add-btn" type="primary" size="mini" @tap="showAddTripForm">添加行程</button>
    </view>
    
    <view v-if="trips.length === 0" class="empty-tip">
      <text>暂无行程，点击"添加行程"按钮创建</text>
    </view>
    
    <view v-else class="trip-list">
      <view 
        v-for="(trip, index) in trips" 
        :key="trip.id" 
        class="trip-item"
        @tap="goToTripDetail(trip.id)"
      >
        <view class="trip-info">
          <view class="trip-name">{{ trip.name }}</view>
          <view class="trip-date">{{ formatDateRange(trip.startDate, trip.duration) }}</view>
          <view class="trip-places">
            <text>{{ getTripPlacesCount(trip) }}个地点</text>
          </view>
        </view>
        <view class="trip-actions">
          <button type="default" size="mini" @tap.stop="addLocation(trip)">添加地点</button>
          <button type="warn" size="mini" @tap.stop="deleteTrip(index)">删除</button>
        </view>
      </view>
    </view>
    
    <!-- 添加行程表单 -->
    <view class="add-trip-form" v-if="showForm">
      <view class="form-header">
        <text>添加新行程</text>
        <text class="close-btn" @tap="showForm = false">×</text>
      </view>
      <view class="form-item">
        <text class="form-label">行程名称</text>
        <input type="text" v-model="newTrip.name" placeholder="请输入行程名称" />
      </view>
      <view class="form-item">
        <text class="form-label">开始日期</text>
        <picker 
          mode="date" 
          :value="newTrip.startDate" 
          @change="onStartDateChange"
        >
          <view class="picker-value">{{ newTrip.startDate || '请选择开始日期' }}</view>
        </picker>
      </view>
      <view class="form-item">
        <text class="form-label">天数</text>
        <picker 
          mode="selector" 
          :range="durationOptions" 
          :value="durationIndex" 
          @change="onDurationChange"
        >
          <view class="picker-value">{{ newTrip.duration }}天</view>
        </picker>
      </view>
      <view class="form-actions">
        <button type="default" size="mini" @tap="showForm = false">取消</button>
        <button type="primary" size="mini" @tap="createTrip">创建</button>
      </view>
    </view>
    
    <view class="mask" v-if="showForm" @tap="showForm = false"></view>
  </view>
</template>

<script>
import { getAllTrips, addTrip, deleteTrip as deleteTrip_, getTripById } from '../../services/trip.js';

export default {
  data() {
    return {
      trips: [],
      showForm: false,
      newTrip: {
        name: '',
        startDate: '',
        duration: 1,
        days: []
      },
      durationOptions: Array.from({ length: 30 }, (_, i) => i + 1)
    };
  },
  computed: {
    durationIndex() {
      return this.newTrip.duration - 1;
    }
  },
  onLoad() {
    this.loadTrips();
  },
  // 每次页面显示时重新加载行程数据
  onShow() {
    this.loadTrips();
  },
  methods: {
    // 加载所有行程
    loadTrips() {
      this.trips = getAllTrips();
    },
    
    // 显示添加行程表单
    showAddTripForm() {
      // 重置表单数据
      this.newTrip = {
        name: '',
        startDate: this.formatDate(new Date()),
        duration: 1,
        days: []
      };
      this.showForm = true;
    },
    
    // 开始日期变化处理
    onStartDateChange(e) {
      this.newTrip.startDate = e.detail.value;
    },
    
    // 行程天数变化处理
    onDurationChange(e) {
      this.newTrip.duration = this.durationOptions[e.detail.value];
    },
    
    // 创建新行程
    createTrip() {
      if (!this.newTrip.name) {
        uni.showToast({
          title: '请输入行程名称',
          icon: 'none'
        });
        return;
      }
      
      if (!this.newTrip.startDate) {
        uni.showToast({
          title: '请选择开始日期',
          icon: 'none'
        });
        return;
      }
      
      // 初始化空的行程天数
      this.newTrip.days = Array.from({ length: this.newTrip.duration }, (_, i) => ({
        dayIndex: i,
        date: this.calculateDate(this.newTrip.startDate, i),
        locations: []
      }));
      
      // 添加新行程
      const success = addTrip(this.newTrip);
      
      if (success) {
        uni.showToast({
          title: '创建成功',
          icon: 'success'
        });
        this.showForm = false;
        this.loadTrips();
      } else {
        uni.showToast({
          title: '创建失败',
          icon: 'none'
        });
      }
    },
    
    // 删除行程
    deleteTrip(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除该行程吗？',
        success: res => {
          if (res.confirm) {
            const tripId = this.trips[index].id;
            const success = deleteTrip_(tripId);
            
            if (success) {
              uni.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadTrips();
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
    
    // 添加地点到行程
    addLocation(trip) {
      uni.switchTab({
        url: `/pages/map/map?addToTrip=true`
      });
    },
    
    // 查看行程详情
    goToTripDetail(tripId) {
      uni.navigateTo({
        url: `/pages/trip/tripDetail?id=${tripId}`
      });
    },
    
    // 格式化日期
    formatDate(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    // 格式化日期范围
    formatDateRange(startDate, duration) {
      if (!startDate) return '';
      
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + duration - 1);
      
      return `${this.formatDate(start)} 至 ${this.formatDate(end)} (${duration}天)`;
    },
    
    // 计算指定天数的日期
    calculateDate(startDate, dayOffset) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + dayOffset);
      return this.formatDate(date);
    },
    
    // 获取行程中的地点数量
    getTripPlacesCount(trip) {
      if (!trip.days) return 0;
      
      return trip.days.reduce((total, day) => {
        return total + (day.locations ? day.locations.length : 0);
      }, 0);
    }
  }
};
</script>

<style>
.container {
  padding: 30rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
}

.empty-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;
  color: #999;
}

.trip-list {
  margin-bottom: 30rpx;
}

.trip-item {
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  background-color: #fff;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.trip-info {
  margin-bottom: 16rpx;
}

.trip-name {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.trip-date {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.trip-places {
  font-size: 24rpx;
  color: #999;
}

.trip-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.add-trip-form {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  z-index: 1001;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.close-btn {
  font-size: 40rpx;
  color: #999;
}

.form-item {
  margin-bottom: 20rpx;
}

.form-label {
  display: block;
  margin-bottom: 10rpx;
  font-size: 28rpx;
  color: #666;
}

.form-item input,
.picker-value {
  width: 100%;
  height: 70rpx;
  line-height: 70rpx;
  border: 1rpx solid #ddd;
  border-radius: 6rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
  margin-top: 30rpx;
}

.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}
</style> 
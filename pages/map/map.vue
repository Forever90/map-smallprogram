<template>
  <view class="container">
    <map
      id="map"
      class="map"
      :latitude="latitude"
      :longitude="longitude"
      :markers="markers"
      :scale="scale"
      show-location
      @markertap="onMarkerTap"
    ></map>
    <view class="controls">
      <view class="search-box">
        <input 
          type="text" 
          v-model="searchKeyword" 
          placeholder="搜索地点" 
          @confirm="searchLocation"
        />
        <button @tap="searchLocation" type="primary" size="mini">搜索</button>
      </view>
      <view class="action-buttons">
        <button @tap="chooseCurrentLocation" type="primary" size="mini">当前位置</button>
        <button @tap="confirmLocation" type="primary" size="mini" :disabled="!selectedLocation">确认选点</button>
      </view>
      
      <view class="trip-selector" v-if="isAddToTrip">
        <picker 
          mode="selector" 
          :range="tripOptions" 
          range-key="name"
          :value="selectedTripIndex" 
          @change="onTripChange"
        >
          <view class="picker-item">
            选择行程: {{ selectedTripIndex >= 0 ? tripOptions[selectedTripIndex].name : '请选择' }}
          </view>
        </picker>
        
        <picker 
          mode="selector" 
          :range="dayOptions" 
          :value="selectedDayIndex" 
          @change="onDayChange"
          :disabled="selectedTripIndex < 0"
        >
          <view class="picker-item">
            选择天数: {{ selectedDayIndex >= 0 ? dayOptions[selectedDayIndex] : '请选择' }}
          </view>
        </picker>
        
        <button 
          @tap="addToTrip" 
          type="primary" 
          size="mini"
          :disabled="!canAddToTrip"
        >添加到行程</button>
      </view>
    </view>
  </view>
</template>

<script>
import { getLocation, chooseLocation } from '../../utils/map.js';
import { getAllTrips, addLocationToTripDay } from '../../services/trip.js';

export default {
  data() {
    return {
      latitude: 39.908823,  // 默认纬度（北京）
      longitude: 116.397470, // 默认经度（北京）
      scale: 14,
      markers: [],
      searchKeyword: '',
      selectedLocation: null,
      selectedMarkerIndex: -1,
      
      // 行程相关
      isAddToTrip: false,
      tripOptions: [],
      selectedTripIndex: -1,
      dayOptions: [],
      selectedDayIndex: -1,
      
      // 从其他页面传来的标记点
      externalMarkers: []
    };
  },
  computed: {
    canAddToTrip() {
      return this.selectedLocation && this.selectedTripIndex >= 0 && this.selectedDayIndex >= 0;
    }
  },
  onLoad(options) {
	console.log("test", options);
    // 初始化地图
    this.initMap();
    
    // 检查是否有传入的标记点
    if (options.markers) {
      try {
        this.externalMarkers = JSON.parse(decodeURIComponent(options.markers));
        this.showExternalMarkers();
      } catch (e) {
        console.error('解析标记点数据失败', e);
      }
    }
    
    // 检查是否是从行程页面跳转来添加地点
    if (options.addToTrip) {
		console.log("options.addToTrip", options.addToTrip);
		this.isAddToTrip = true;
		this.loadTripOptions();
    }
  },
  methods: {
    async initMap() {
      try {
        const location = await getLocation();
        this.latitude = location.latitude;
        this.longitude = location.longitude;
        
        // 添加当前位置标记
        this.addMarker({
          id: 0,
          latitude: location.latitude,
          longitude: location.longitude,
          title: '当前位置',
          iconPath: '/static/images/location.png',
          width: 30,
          height: 30
        });
      } catch (err) {
        console.error('初始化地图失败', err);
        uni.showToast({
          title: '获取位置失败，使用默认位置',
          icon: 'none'
        });
      }
    },
    
    // 添加标记点
    addMarker(marker) {
      // 检查是否已有相同ID的标记点
      const index = this.markers.findIndex(m => m.id === marker.id);
      if (index > -1) {
        // 更新已有标记点
        this.markers.splice(index, 1, marker);
      } else {
        // 添加新标记点
        this.markers.push(marker);
      }
    },
    
    // 清除所有标记点
    clearMarkers() {
      this.markers = [];
    },
    
    // 搜索位置
    searchLocation() {
      if (!this.searchKeyword.trim()) {
        uni.showToast({
          title: '请输入搜索关键词',
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({
        title: '搜索中...'
      });
      
      // 使用uni.request调用高德地图POI搜索API
      // 注意：实际使用时需要替换为您的高德地图API Key
      uni.request({
        url: 'https://restapi.amap.com/v3/place/text',
        data: {
          key: '您的高德地图API Key',
          keywords: this.searchKeyword,
          location: `${this.longitude},${this.latitude}`,
          city: '',
          offset: 10,  // 返回结果数目
          page: 1,
          extensions: 'all'
        },
        success: (res) => {
          uni.hideLoading();
          
          if (res.data && res.data.pois && res.data.pois.length > 0) {
            // 清除之前的搜索结果标记
            this.clearMarkers();
            
            // 添加当前位置标记
            this.addMarker({
              id: 0,
              latitude: this.latitude,
              longitude: this.longitude,
              title: '当前位置',
              iconPath: '/static/images/location.png',
              width: 30,
              height: 30
            });
            
            // 添加搜索结果标记
            res.data.pois.forEach((poi, index) => {
              const [lng, lat] = poi.location.split(',');
              this.addMarker({
                id: index + 1,
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                title: poi.name,
                iconPath: '/static/images/marker.png',
                width: 30,
                height: 30,
                callout: {
                  content: poi.name,
                  color: '#000000',
                  fontSize: 12,
                  borderRadius: 4,
                  padding: 6,
                  display: 'ALWAYS'
                },
                // 存储完整POI信息以备使用
                poi: {
                  name: poi.name,
                  address: poi.address,
                  latitude: parseFloat(lat),
                  longitude: parseFloat(lng)
                }
              });
            });
            
            // 将视图移动到第一个搜索结果
            const firstPoi = res.data.pois[0];
            const [lng, lat] = firstPoi.location.split(',');
            this.latitude = parseFloat(lat);
            this.longitude = parseFloat(lng);
          } else {
            uni.showToast({
              title: '未找到相关地点',
              icon: 'none'
            });
          }
        },
        fail: () => {
          uni.hideLoading();
          uni.showToast({
            title: '搜索失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 选择当前位置
    async chooseCurrentLocation() {
      try {
        const location = await chooseLocation();
        
        // 更新地图中心点
        this.latitude = location.latitude;
        this.longitude = location.longitude;
        
        // 添加选中位置的标记
        const markerId = this.markers.length + 1;
        this.addMarker({
          id: markerId,
          latitude: location.latitude,
          longitude: location.longitude,
          title: location.name,
          iconPath: '/static/images/marker.png',
          width: 30,
          height: 30,
          callout: {
            content: location.name,
            color: '#000000',
            fontSize: 12,
            borderRadius: 4,
            padding: 6,
            display: 'ALWAYS'
          }
        });
        
        // 保存选中的位置
        this.selectedLocation = {
          id: markerId,
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude
        };
        
        this.selectedMarkerIndex = this.markers.findIndex(marker => marker.id === markerId);
      } catch (err) {
        console.error('选择位置失败', err);
      }
    },
    
    // 标记点点击事件
    onMarkerTap(e) {
      const markerId = e.markerId;
      const marker = this.markers.find(item => item.id === markerId);
      
      if (marker) {
        this.selectedMarkerIndex = this.markers.indexOf(marker);
        
        // 如果标记点有POI信息，使用POI信息
        if (marker.poi) {
          this.selectedLocation = { ...marker.poi };
        } else {
          this.selectedLocation = {
            id: marker.id,
            name: marker.title || '未命名地点',
            address: marker.address || '',
            latitude: marker.latitude,
            longitude: marker.longitude
          };
        }
        
        // 更新地图中心点
        this.latitude = marker.latitude;
        this.longitude = marker.longitude;
      }
    },
    
    // 确认选择的位置
    confirmLocation() {
      if (!this.selectedLocation) {
        uni.showToast({
          title: '请先选择位置',
          icon: 'none'
        });
        return;
      }
      console.log("this.isAddToTrip",this.isAddToTrip);
      // 如果是从其他页面跳转来添加地点到行程的，不关闭页面
      if (!this.isAddToTrip) {
        // 将选中的位置信息返回给上一个页面
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        
        if (prevPage) {
          // 触发上一个页面的方法，传递选中的位置
          prevPage.$vm.onLocationSelected && prevPage.$vm.onLocationSelected(this.selectedLocation);
        }
        
        uni.navigateBack();
      } else {
        uni.showToast({
          title: '请选择行程和天数',
          icon: 'none'
        });
      }
    },
    
    // 显示从其他页面传入的标记点
    showExternalMarkers() {
      if (!this.externalMarkers || !this.externalMarkers.length) return;
      
      // 清除现有标记点
      this.clearMarkers();
      
      // 添加传入的标记点
      this.externalMarkers.forEach((location, index) => {
        this.addMarker({
          id: index,
          latitude: location.latitude,
          longitude: location.longitude,
          title: location.name,
          iconPath: '/static/images/marker.png',
          width: 30,
          height: 30,
          callout: {
            content: location.name,
            color: '#000000',
            fontSize: 12,
            borderRadius: 4,
            padding: 6,
            display: 'ALWAYS'
          }
        });
      });
      
      // 更新地图中心点为第一个标记点
      if (this.externalMarkers.length > 0) {
        this.latitude = this.externalMarkers[0].latitude;
        this.longitude = this.externalMarkers[0].longitude;
      }
    },
    
    // 加载行程选项
    loadTripOptions() {
      const trips = getAllTrips();
      
      if (trips.length === 0) {
        uni.showToast({
          title: '暂无行程，请先创建行程',
          icon: 'none'
        });
        return;
      }
      
      this.tripOptions = trips.map(trip => ({
        id: trip.id,
        name: trip.name,
        startDate: trip.startDate,
        days: trip.days || [],
        duration: trip.duration
      }));
    },
    
    // 行程选择变化
    onTripChange(e) {
      this.selectedTripIndex = e.detail.value;
      this.selectedDayIndex = -1; // 重置天数选择
      
      // 更新天数选项
      if (this.selectedTripIndex >= 0) {
        const trip = this.tripOptions[this.selectedTripIndex];
        const dayCount = trip.duration || 1;
        
        // 创建天数选项数组，从第1天到第N天
        this.dayOptions = Array.from({ length: dayCount }, (_, i) => `第${i + 1}天`);
      }
    },
    
    // 天数选择变化
    onDayChange(e) {
      this.selectedDayIndex = e.detail.value;
    },
    
    // 添加位置到行程
    addToTrip() {
      if (!this.canAddToTrip) {
        uni.showToast({
          title: '请选择位置、行程和天数',
          icon: 'none'
        });
        return;
      }
      
      const tripId = this.tripOptions[this.selectedTripIndex].id;
      const dayIndex = this.selectedDayIndex;
      
      // 添加位置到行程
      const success = addLocationToTripDay(tripId, dayIndex, this.selectedLocation);
      
      if (success) {
        uni.showToast({
          title: '添加成功',
          icon: 'success'
        });
        
        // 返回行程页面
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      } else {
        uni.showToast({
          title: '添加失败',
          icon: 'none'
        });
      }
    }
  }
};
</script>

<style>
.container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.map {
  width: 100%;
  height: 100%;
}

.controls {
  position: absolute;
  bottom: 30rpx;
  left: 30rpx;
  right: 30rpx;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.search-box {
  display: flex;
  margin-bottom: 20rpx;
}

.search-box input {
  flex: 1;
  height: 70rpx;
  border: 1rpx solid #ddd;
  border-radius: 6rpx;
  padding: 0 20rpx;
  margin-right: 20rpx;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.trip-selector {
  border-top: 1rpx solid #eee;
  padding-top: 20rpx;
}

.picker-item {
  height: 70rpx;
  line-height: 70rpx;
  margin-bottom: 20rpx;
  padding: 0 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 6rpx;
}
</style> 
<template>
	<view class="container">
		<view class="header">
			<image class="logo" src="/static/logo.png"></image>
			<text class="title">行程助手</text>
		</view>
		
		<view class="intro">
			<text class="intro-text">基于高德地图的旅行行程规划助手，帮助您轻松安排多日行程</text>
		</view>
		
		<view class="features">
			<view class="feature-item" @tap="goToMap">
				<image class="feature-icon" src="/static/images/map-feature.png"></image>
				<text class="feature-title">地图选点</text>
				<text class="feature-desc">在地图上查找和选择地点</text>
			</view>
			
			<view class="feature-item" @tap="goToTrip">
				<image class="feature-icon" src="/static/images/trip-feature.png"></image>
				<text class="feature-title">行程规划</text>
				<text class="feature-desc">创建和管理多日行程计划</text>
			</view>
		</view>
		
		<view class="quick-actions">
			<button type="primary" @tap="createNewTrip">创建新行程</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				title: '行程助手'
			}
		},
		onLoad() {
			// 页面加载
		},
		methods: {
			// 跳转到地图页面
			goToMap() {
				uni.switchTab({
					url: '/pages/map/map'
				});
			},
			
			// 跳转到行程页面
			goToTrip() {
				uni.switchTab({
					url: '/pages/trip/trip'
				});
			},
			
			// 直接创建新行程
			createNewTrip() {
				uni.switchTab({
					url: '/pages/trip/trip',
					success: () => {
						// 延迟执行，确保页面已加载
						setTimeout(() => {
							// 获取当前页面实例
							const pages = getCurrentPages();
							const currentPage = pages[pages.length - 1];
							
							// 调用页面的方法
							currentPage.$vm.showAddTripForm && currentPage.$vm.showAddTripForm();
						}, 500);
					}
				});
			}
		}
	}
</script>

<style>
	.container {
		padding: 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.header {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 60rpx;
	}

	.logo {
		width: 180rpx;
		height: 180rpx;
		margin-bottom: 20rpx;
	}

	.title {
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
	}

	.intro {
		text-align: center;
		margin-bottom: 60rpx;
	}

	.intro-text {
		font-size: 30rpx;
		color: #666;
		line-height: 1.5;
	}

	.features {
		display: flex;
		justify-content: space-around;
		width: 100%;
		margin-bottom: 80rpx;
	}

	.feature-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 45%;
		background-color: #f8f8f8;
		border-radius: 12rpx;
		padding: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	}

	.feature-icon {
		width: 100rpx;
		height: 100rpx;
		margin-bottom: 20rpx;
	}

	.feature-title {
		font-size: 32rpx;
		font-weight: bold;
		margin-bottom: 10rpx;
	}

	.feature-desc {
		font-size: 24rpx;
		color: #999;
		text-align: center;
	}

	.quick-actions {
		width: 100%;
	}

	.quick-actions button {
		width: 100%;
		height: 90rpx;
		line-height: 90rpx;
		font-size: 32rpx;
	}
</style>

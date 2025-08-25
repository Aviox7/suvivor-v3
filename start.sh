#!/bin/bash

echo "🎮 启动 Vampire Survivors 游戏分析系统"
echo "=========================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 Node.js (包含npm)"
    exit 1
fi

echo "✅ Node.js 和 npm 已安装"

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 项目依赖已存在"
fi

# 启动服务器
echo "🚀 启动游戏服务器..."
echo "   游戏地址: http://localhost:3000"
echo "   分析API: http://localhost:3000/api/analytics/stats"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "=========================================="

node server.js
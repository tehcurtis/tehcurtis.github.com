#!/bin/bash

# Blog Control Script for Curtis on Code and Things
# Usage: ./blog.sh [start|stop|restart|status|build]

BLOG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$BLOG_DIR/.jekyll.pid"
LOG_FILE="$BLOG_DIR/.jekyll.log"
PORT=4000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BLOG]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Jekyll is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to start the blog
start_blog() {
    if is_running; then
        print_warning "Blog is already running (PID: $(cat $PID_FILE))"
        return 1
    fi

    print_status "Starting Jekyll blog server..."
    cd "$BLOG_DIR"
    
    # Start Jekyll in background
    bundle exec jekyll serve --detach --port "$PORT" > "$LOG_FILE" 2>&1 &
    local jekyll_pid=$!
    
    # Wait a moment for Jekyll to start
    sleep 2
    
    # Check if it's still running
    if ps -p "$jekyll_pid" > /dev/null 2>&1; then
        echo "$jekyll_pid" > "$PID_FILE"
        print_success "Blog started successfully!"
        print_status "Server running at: http://localhost:$PORT"
        print_status "PID: $jekyll_pid"
        print_status "Log file: $LOG_FILE"
    else
        print_error "Failed to start blog server"
        print_status "Check log file: $LOG_FILE"
        return 1
    fi
}

# Function to stop the blog
stop_blog() {
    if ! is_running; then
        print_warning "Blog is not running"
        return 1
    fi

    local pid=$(cat "$PID_FILE")
    print_status "Stopping Jekyll blog server (PID: $pid)..."
    
    kill "$pid" 2>/dev/null
    
    # Wait for graceful shutdown
    local count=0
    while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        print_warning "Force killing Jekyll process..."
        kill -9 "$pid" 2>/dev/null
    fi
    
    rm -f "$PID_FILE"
    print_success "Blog stopped successfully!"
}

# Function to restart the blog
restart_blog() {
    print_status "Restarting blog..."
    stop_blog
    sleep 1
    start_blog
}

# Function to check blog status
status_blog() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        print_success "Blog is running (PID: $pid)"
        print_status "Server: http://localhost:$PORT"
        print_status "Log file: $LOG_FILE"
        
        # Show recent log entries
        if [ -f "$LOG_FILE" ]; then
            print_status "Recent log entries:"
            tail -5 "$LOG_FILE" | sed 's/^/  /'
        fi
    else
        print_warning "Blog is not running"
        
        # Check if there are any Jekyll processes
        local jekyll_procs=$(pgrep -f jekyll)
        if [ -n "$jekyll_procs" ]; then
            print_warning "Found orphaned Jekyll processes:"
            echo "$jekyll_procs" | sed 's/^/  PID: /'
            print_status "Run './blog.sh stop' to clean them up"
        fi
    fi
}

# Function to build the site
build_blog() {
    print_status "Building Jekyll site..."
    cd "$BLOG_DIR"
    
    if bundle exec jekyll build; then
        print_success "Site built successfully!"
        print_status "Output directory: _site/"
    else
        print_error "Build failed!"
        return 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start the Jekyll blog server"
    echo "  stop      Stop the Jekyll blog server"
    echo "  restart   Restart the Jekyll blog server"
    echo "  status    Show blog server status"
    echo "  build     Build the site without starting server"
    echo "  logs      Show recent log entries"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 stop"
    echo "  $0 status"
}

# Function to show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        print_status "Recent log entries:"
        tail -20 "$LOG_FILE"
    else
        print_warning "No log file found"
    fi
}

# Main script logic
case "${1:-help}" in
    start)
        start_blog
        ;;
    stop)
        stop_blog
        ;;
    restart)
        restart_blog
        ;;
    status)
        status_blog
        ;;
    build)
        build_blog
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_usage
        exit 1
        ;;
esac
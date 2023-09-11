class Snake {
  constructor(canvas, { width = 400, height = 400 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = width;
    this.height = height;
    // 分数
    this._score = 0;
    // 格子宽度
    this.gap = 10; 
    // 状态
    this.status = 'stop'
    // 速度
    this.speed = 150
    // 初始化
    this.init();
    // 分数回调
    this.onChangeCallback = null;
  }
  // 设置回调函数
  setOnChangeCallback(callback) {
    typeof callback === 'function' && (this.onChangeCallback = callback);
  }
  init() {
    const { canvas, width, height } = this;
    canvas.width = width;
    canvas.height = height;
    // 方向，默认往右
    this.direction = "right"; 
    // 画格子
    this.drawGrid();
    // 初始化蛇
    this.snake = [
      { x: 10, y: 100 },
      { x: 20, y: 100 },
      { x: 30, y: 100 },
      { x: 40, y: 100 },
      { x: 50, y: 100 },
    ];
    // 初始化食物
    this.food = this.randomFood();
    // 绘制蛇
    this.drawSnake();
    // 绘制食物
    this.drawFood();
    // 绑定操作
    this.bindEvent();
  }

  get score() {
    return this._score;
  }

  // 只要调用this.score = xx，就会触发此函数
  set score(value) {
    this._score = value;
    if (this.onChangeCallback) {
      this.onChangeCallback({
        type: 'score',
        data: this.score
      }); // 调用回调函数或触发事件，将最新数据传递给外部
    }
  }

  start() {
    // 运动
    if (this.status === 'stop') {
      this.status = 'running';
      this.move();
    }
  }

  stop() {
    // 停止/继续
    this.status = 'stop';
  }

  continue() {
    // 继续
    if (this.status === 'stop') {
      this.status = 'running';
    }
  }

  restart() {
    // 重新开始
    this.score = 0
    this.status = 'running';
    this.init();
    this.move();
  }

  // 画格子
  drawGrid() {
    const { ctx, width, height, gap } = this;
    // 背景
    ctx.fillStyle = "#96c93d";
    ctx.fillRect(0, 0, width, height);
    // 线条
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#fff";
    for (let i = 0; i < width; i += gap) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
      ctx.closePath();
    }
    for (let i = 0; i < height; i += gap) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
      ctx.closePath();
    }
  }

  // 随机生成食物
  randomFood() {
    const { width, height, snake } = this;
    // 生成0-最大宽大之间的10倍的整数
    const x = Math.floor((Math.random() * width) / 10) * 10;
    const y = Math.floor((Math.random() * height) / 10) * 10;

    if (snake.some((item) => item.x === x && item.y === y)){
      this.randomFood()
    }
    return { x, y };
  }

  drawSnake() {
    const { ctx, snake, gap, width, height } = this;
    snake.forEach((item, index) => {
      if (index === snake.length - 1) {
        ctx.fillStyle = "red";
      } else {
        ctx.fillStyle = "black";
      }
      ctx.fillRect(item.x + 1, item.y + 1, gap - 1, gap - 1);
    });
  }

  drawFood() {
    const { ctx } = this;
    const { x, y } = this.food;
    ctx.fillStyle = "#035c03";
    ctx.fillRect(x, y, this.gap, this.gap);
  }

  move() {
    const { width, height, ctx, snake, gap, direction } = this;
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      // 控制蛇的移动
      if (this.status !== 'running') {
        return
      }
      // 更新蛇的坐标
      // 获取增加的节点
      const { x, y } = this.updateSnake()
      // 吃
      this.handleEat(x, y)
      // 游戏结束
      if (this.isHitWall({ x, y }) || this.isEatSelf({ x, y })) {
        this.status = 'over'
        this.onChangeCallback({
          type: 'over'
        })
        clearInterval(this.timer);
        return
      }
      // 尾巴去掉一格
      snake.shift();
      // 头部新增一格
      snake.push({ x, y });
      // 清空画布
      ctx.clearRect(0, 0, width, height);
      // 画格子
      this.drawGrid();
      // 画食物
      this.drawFood();
      // 重新画蛇
      this.drawSnake();
    }, this.speed);
  }

  updateSnake() {
    const { snake, direction, gap } = this
    let { x, y } = snake.at(-1);
    switch (direction) {
      case "right":
        x += gap;
        break;
      case "left":
        x -= gap;
        break;
      case "top":
        y -= gap;
        break;
      case "bottom":
        y += gap;
        break;
      default:
        break;
    }
    return { x, y }
  }

  handleEat(x, y) {
    const { snake, direction, gap, ctx } = this
    if (x === this.food.x && y === this.food.y) {
      this.score += 10
      // 吃到了食物
      let { x, y } = snake[0];
      switch (direction) {
        case "right":
          x -= gap;
          break;
        case "left":
          x += gap;
          break;
        case "top":
          y += gap;
          break;
        case "bottom":
          y -= gap;
          break;
        default:
          break;
      }
      // 尾部增加一节
      snake.unshift({ x, y });
      // 清空食物
      ctx.clearRect(this.food.x, this.food.y, gap, gap);
      // 重新生成食物
      this.food = this.randomFood();
    }
  }

  // 判断是否撞墙
  isHitWall(head) {
    const { width, height } = this;
    return head.x >= width || head.x < 0 || head.y >= height || head.y < 0
  }

  // 判断是否吃到了自己
  isEatSelf(head) {
    const { snake } = this
    const body = snake.slice(1);
    return body.some(item => item.x === head.x && item.y === head.y);
  }

  toTop() {
    if (this.direction === "bottom") return;
    this.direction = "top";
    this.move();
  }
  toBottom() {
    if (this.direction === "top") return;
    this.direction = "bottom";
    this.move();
  }
  toLeft() {
    if (this.direction === "right") return;
    this.direction = "left";
    this.move();
  }
  toRight() {
    if (this.direction === "left") return;
    this.direction = "right";
    this.move();
  }

  // 绑定键盘操作
  bindEvent() {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    document.addEventListener("keydown", debounce((event) => {
      if (!keys.includes(event.key)) return
      if (event.key === "ArrowUp" && this.direction !== "bottom") {
        this.toTop()
      } else if (event.key === "ArrowDown" && this.direction !== "top") {
        this.toBottom()
      } else if (event.key === "ArrowLeft" && this.direction !== "right") {
        this.toLeft()
      } else if (event.key === "ArrowRight" && this.direction !== "left") {
        this.toRight()
      }
    }), this.speed);
  }
}

function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}
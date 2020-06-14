// attempts to open the page in fullscreen
function open_fullscreen()
{
	if (game.canvas.requestFullscreen)
	{
		game.canvas.requestFullscreen();
	}
	else if (game.canvas.mozRequestFullScreen) // Firefox
	{
		game.canvas.mozRequestFullScreen();
	}
	else if (game.canvas.webkitRequestFullscreen) /* Chrome, Safari and Opera */
  	{
		game.canvas.webkitRequestFullscreen();
	}
	else if (game.canvas.msRequestFullscreen) // IE/Edge
	{ 
		game.canvas.msRequestFullscreen();
	}
}

// attempts to close fullscreen mode
function close_fullscreen()
{
	if (game.canvas.exitFullscreen)
	{
		game.canvas.exitFullscreen();
	}
	else if (game.canvas.mozCancelFullScreen) // Firefox
	{
		game.canvas.mozCancelFullScreen();
	}
	else if (game.canvas.webkitExitFullscreen) // Chrome, Safari and Opera
	{
		game.canvas.webkitExitFullscreen();
	}
	else if (game.canvas.msExitFullscreen) // IE/Edge
	{
		game.canvas.msExitFullscreen();
	}
}

// class for the ball
class ball_t
{

	reset(total_points = 0)
	{
		this.x = this.old_x = this.canvas.width / 2;
		this.y = this.old_y = this.canvas.height / 2;
		this.speed_y = 0.0;
		this.speed_x = Math.random() <= 0.5 ? -this.initial_speed - total_points : this.initial_speed + total_points;
	}

	constructor(initial_speed, size, canvas, ctx)
	{
		this.ball_size = size;
		this.initial_speed = initial_speed;
		this.speed_y = 0.0;
		this.speed_x = Math.random() <= 0.5 ? -initial_speed : initial_speed;
		this.x = this.old_x = canvas.width / 2;
		this.y = this.old_y = canvas.height / 2;
		this.clr = "rgb(200,200,200)";
		this.ctx = ctx;
		this.canvas = canvas;
	}

	draw()
	{
		this.ctx.fillStyle = this.clr;
		this.ctx.fillRect(this.x - this.ball_size / 2, this.y - this.ball_size / 2, this.ball_size, this.ball_size);
	}

};

// class for the keyboard events we need
class control_keys_t
{

	reset()
	{
		let now = performance.now();

		this.pressed = [false,false,false,false];
		this.down_time = [now,now,now,now];
	}

	constructor()
	{
		this.reset();
		this.keys = { w: 0, s: 1, down: 2, up: 3 };
	}

	is_pressed(key)
	{
		return this.pressed[key];
	}

	get_time_delta(key, now)
	{
		return now - this.down_time[key];
	}

};

// class for the paddles
class paddle_t
{

	reset(total_points = 0)
	{
		this.moving_to_calculated_position = this.calculated_position_set = false;
		this.direction = this.directions.none;
		this.is_cpu = true;
		this.calculated_y = this.calculated_y_clamped = -1;
		this.x = Math.floor(this.left ? this.x_offset : (this.canvas.width - this.x_offset) - this.size.width);
		this.y = Math.floor(this.canvas.height / 2 - this.size.height / 2);
		this.base_speed_scaled = this.base_speed + total_points;
	}

	constructor(x_offset, size_x, size_y, base_speed, canvas, ctx, left)
	{
		this.directions = { up: 2, down: 1, none: 0 };
		this.x_offset = x_offset;
		this.speed = 0.0;
		this.canvas = canvas;
		this.base_speed = base_speed;
		this.points = 0;
		this.left = left;
		this.size = { width: size_x, height: size_y };
		this.ctx = ctx;
		this.clr = "rgb(220,220,220)";
		this.reset();
	}

	draw()
	{
		this.ctx.fillStyle = this.clr;
		this.ctx.fillRect(this.x, this.y, this.size.width, this.size.height);
	}

	intersect(ball)
	{
		function do_boxes_intersect_or_touch(b1_x, b1_y, b1_width, b1_height, b2_x, b2_y, b2_width, b2_height)
		{
			return !(b2_x >= b1_x + b1_width || b2_x + b2_width <= b1_x || b2_y >= b1_y + b1_height || b2_y + b2_height <= b1_y);
		}

		// check if the ball position changed
		if (ball.x != ball.old_x || ball.y != ball.old_y)
		{
			let past_x = this.left ? 	ball.old_x > this.x + this.size.width && ball.x < this.x : // left paddle
										ball.old_x < this.x && ball.x > this.x + this.size.width;  // right paddle
			let past_y = ball.old_y >= this.y && ball.old_y <= this.y + this.size.height && (ball.y < this.y || ball.y > this.y + this.size.height);

			if (past_x || past_y)
			{
				// ball flew through a paddle, check all the inbetween positions for intersection too
				let offset_x = ball.x - ball.old_x;
	            let offset_y = ball.y - ball.old_y;
	            let amount_x = Math.abs(offset_x) / ball.ball_size;
	            let amount_y = Math.abs(offset_y) / ball.ball_size;

	            if (amount_x > 0 || amount_y > 0)
	            {
	                let highest_amount = Math.max(amount_x, amount_y);

	                for (let i = 0; i < highest_amount; i++)
	                {
	                    let mult_x = 0., mult_y = 0.;
	                    
	                    if (highest_amount == amount_x)
	                    {
	                        mult_x = (i + 1) / amount_x;
	                        mult_y = mult_x;
	                    }
	                    else
	                    {
	                        mult_y = (i + 1) / amount_y;
	                        mult_x = mult_y;
	                    }

	                    let ball_x = ball.old_x + offset_x * mult_x;
	                    let ball_y = ball.old_y + offset_y * mult_y;
	                    let old_ball_x = ball.x;
	                    let old_ball_y = ball.y;
	                    
	                    ball.x = ball_x;
	                    ball.y = ball_y;

	                    if (do_boxes_intersect_or_touch(ball.x - (ball.ball_size / 2), ball.y - (ball.ball_size / 2), ball.ball_size, ball.ball_size, this.x, this.y, this.size.width, this.size.height)) return true;

	                    ball.x = old_ball_x;
	                    ball.y = old_ball_y;
	                }

	                // all inbetween and final positions already checked, no intersection
	                return false;
	            }
			}
		}

		// ball didn't fly through a paddle, simply check for intersection
    	return do_boxes_intersect_or_touch(ball.x - (ball.ball_size / 2), ball.y - (ball.ball_size / 2), ball.ball_size, ball.ball_size, this.x, this.y, this.size.width, this.size.height);
	}

};

class difficulty_t
{

	constructor(name,
				enable_paddle_speed_minmax_variance,
				enable_calculated_pos_minmax_variance,
            	paddle_speed_multiplier_min,
                paddle_speed_multiplier_max,
                min_calculated_pos_multiplier,
                max_calculated_pos_multiplier,
                calculated_pos_moving_chance)
	{
		this.current_calculated_pos_multiplier = 0.0;
		this.current_paddle_speed_multiplier = 1.0;
		this.go_to_calculated_position = false;
        this.difname = name;
        this.enable_paddle_speed_minmax_variance = enable_paddle_speed_minmax_variance;
        this.enable_calculated_pos_minmax_variance = enable_calculated_pos_minmax_variance;
        this.paddle_speed_multiplier_min = paddle_speed_multiplier_min;
        this.paddle_speed_multiplier_max = paddle_speed_multiplier_max;
        this.min_calculated_pos_multiplier = min_calculated_pos_multiplier;
        this.max_calculated_pos_multiplier = max_calculated_pos_multiplier;
        this.calculated_pos_moving_chance = calculated_pos_moving_chance;

		if (!this.enable_calculated_pos_minmax_variance && this.min_calculated_pos_multiplier == this.max_calculated_pos_multiplier)
        {
            this.is_calculated_pos_multiplier_dynamic = false;
            this.current_calculated_pos_multiplier = this.max_calculated_pos_multiplier;
        }
        else
        {
            this.is_calculated_pos_multiplier_dynamic = true;
        }

        if (!this.enable_paddle_speed_minmax_variance && this.paddle_speed_multiplier_min == this.paddle_speed_multiplier_max)
        {
            this.is_paddle_speed_multiplier_dynamic = false;
            this.current_paddle_speed_multiplier = this.paddle_speed_multiplier_max;
        }
        else
        {
            this.is_paddle_speed_multiplier_dynamic = true;
        }
	}

	generate_numbers()
	{
		if (!this.enable_calculated_pos_minmax_variance)
        {
            this.current_calculated_pos_multiplier = this.max_calculated_pos_multiplier;
        }
        else
        {
            this.current_calculated_pos_multiplier = (this.min_calculated_pos_multiplier != this.max_calculated_pos_multiplier) ? this.min_calculated_pos_multiplier + Math.random() * (this.max_calculated_pos_multiplier - this.min_calculated_pos_multiplier) : this.max_calculated_pos_multiplier;
        }

        if (!this.enable_paddle_speed_minmax_variance)
        {
            this.current_paddle_speed_multiplier = this.paddle_speed_multiplier_max;
        }
        else
        {
            this.current_paddle_speed_multiplier = (this.paddle_speed_multiplier_min != this.paddle_speed_multiplier_max) ? this.paddle_speed_multiplier_min + Math.random() * (this.paddle_speed_multiplier_max - this.paddle_speed_multiplier_min) : this.paddle_speed_multiplier_max;
        }

        if (this.calculated_pos_moving_chance < 1.0)
        {
            this.go_to_calculated_position = Math.random() >= 1.0 - this.calculated_pos_moving_chance;
        }
        else if (!this.go_to_calculated_position)
        {
            this.go_to_calculated_position = true;
        }
	}

	should_paddle_go_to_calculated_position(screen_width, ball_x, left)
	{
		if (!this.go_to_calculated_position) return false;
        if (!this.is_calculated_pos_multiplier_dynamic && this.min_calculated_pos_multiplier == 0.0 && this.max_calculated_pos_multiplier == 0.0) return true;

        return !left ? (ball_x >= (screen_width * (1.0 - this.current_calculated_pos_multiplier))) : (ball_x <= screen_width - (screen_width * (1.0 - this.current_calculated_pos_multiplier)));
	}

};

class difficultymanager_t
{

	constructor()
	{
		this.difficulty_indexes = { easy: 0, medium: 1, hard: 2, impossible: 3 };
		this.difficulty_names = ["Easy","Medium","Hard","Impossible"];
		this.current_difficulty = this.difficulty_indexes.hard;
		this.difficulty_set = true;
		this.difficulties = [];
	}

	create_difficulty(	diff_num,
						enable_paddle_speed_minmax_variance,
                        enable_calculated_pos_minmax_variance,
                        paddle_speed_multiplier_min,
                        paddle_speed_multiplier_max,
                        min_calculated_pos_multiplier,
                        max_calculated_pos_multiplier,
                        calculated_pos_moving_chance = 1.0)
	{
		if (diff_num < 0 || diff_num >= this.difficulty_names.length) return;

        this.difficulties[diff_num] = new difficulty_t(	this.difficulty_names[diff_num],
                                                        enable_paddle_speed_minmax_variance,
                                                        enable_calculated_pos_minmax_variance,
                                                        paddle_speed_multiplier_min,
                                                        paddle_speed_multiplier_max,
                                                        min_calculated_pos_multiplier,
                                                        max_calculated_pos_multiplier,
                                                        calculated_pos_moving_chance);
	}

	choose_difficulty(diff_num)
	{
		if (diff_num < 0 || diff_num >= this.difficulty_names.length) return;

		this.current_difficulty = diff_num;
	}

	get_current_difficulty()
	{
		return this.difficulties[this.current_difficulty];
	}

};

// information about frametime and fps
// taken from https://stackoverflow.com/questions/8279729/calculate-fps-in-canvas-using-requestanimationframe
// and modified a bit
const fps = {

	// how many samples we save for our average
    sample_size : 60,

    // current fps value
    value : 0,

    // samples for our average
    samples : [],

    // current index for the samples
    current_index : 0,

    // last time (used to get delta time)
    last_tick: false,

    // last delta
    last_delta : (1000.0 / 60.0) / 1000.0, // default 60fps delta

    tick : function()
    {
        // if is first tick, just set tick timestamp and return
        if (!this.last_tick )
        {
            this.last_tick = performance.now();

            return 0;
        }

        // calculate necessary values to obtain current tick FPS
        let now = performance.now();
        let delta = (now - this.last_tick) / 1000;
        let fps = 1 / delta;

        // store the delta time
        this.last_delta = delta;

        // add to fps samples, current tick fps value
        this.samples[this.current_index] = Math.round(fps);
        
        // iterate samples to obtain the average
        let average = 0;

        for (let i = 0; i < this.samples.length; i++) average += this.samples[i];

        average = Math.round(average / this.samples.length);

        // set new FPS
        this.value = average;

        // store current timestamp
        this.last_tick = now;

        // increase sample index counter, and reset it
        // to 0 if exceded maximum sample_size limit
        this.current_index++;

        if (this.current_index === this.sample_size) this.current_index = 0;

        return this.value;
    },

    get_last_delta : function()
    {
    	return this.last_delta;
    }

};

// defines our game
const game = {

	// is the mouse down?
	mouse_down : false,

	// mouse position
	mouse_position : { x: -1, y: -1 },

	// canvas element
	canvas : document.getElementById("game_canvas"),

	// colors
	background_color : "rgb(30,30,30)",

	// starts the game, sets up the canvas and
	// creates the interval for updating
	start : function()
	{
		// set up the canvas
		this.canvas.width = 1280;
		this.canvas.height = 720;
		this.context = this.canvas.getContext("2d");

		// create the ball
		this.ball = new ball_t(800.0, 20.0 * (this.canvas.height / 1080.0), this.canvas, this.context);

		// calculate paddle position/size
		let x_offset = this.canvas.width / 20.0;
		let size_x = x_offset / 5.0;
		let size_y = Math.floor(this.canvas.height * 0.1);

		// create the paddles (the constant is the move speed)
		this.left_paddle = new paddle_t(x_offset, size_x, size_y, 1000.0, this.canvas, this.context, true);
		this.right_paddle = new paddle_t(x_offset, size_x, size_y, 1000.0, this.canvas, this.context, false);

		// create our control keys for movement
		this.control_keys = new control_keys_t();

		// create our difficultymanager and its difficulty levels
		this.difficultymanager = new difficultymanager_t();

		// easy, set paddle speed to half and disable going to the calculated position entirely
		this.difficultymanager.create_difficulty(this.difficultymanager.difficulty_indexes.easy,
		                                    false, false,
		                                    0.5, 0.8,
		                                    0.2, 1.0,
		                                    0.2);
		// medium, set paddle speed to half (minimum) and 80% (maximum) and give it a 20% chance to go to the calculated position (but only when 80-90% towards the other side)
		this.difficultymanager.create_difficulty(this.difficultymanager.difficulty_indexes.medium,
		                                    true, true,
		                                    0.7, 0.95,
		                                    0.3, 0.2,
		                                    0.5);
		// hard, set paddle speed to 100% (minimum) and 120% (maximum) and go to the calculated position between 60-70% of the ball getting to the paddle
		// Also a 95% chance to move to the calculated position when 30-40% within the range of the cpu paddle
		this.difficultymanager.create_difficulty(this.difficultymanager.difficulty_indexes.hard,
		                                    true, true,
		                                    1.0, 1.2,
		                                    0.4, 0.3,
		                                    0.95);
		// impossible, set the paddle speed to 100% and always go to the calculated position
		this.difficultymanager.create_difficulty(this.difficultymanager.difficulty_indexes.impossible,
		                                    false, false,
		                                    1.0, 1.0,
		                                    0.0, 0.0);

		// insert canvas before any other elements in the body
		document.body.insertBefore(this.canvas, document.body.childNodes[0]);

		// make the draw function run every 16.6ms (60fps)
		//this.interval = setInterval(update_game_area, 1000.0 / 60.0);
		this.anim_frame = window.requestAnimationFrame(update_game_area);

		// toggle fullscreen mode if we click on the canvas
		this.canvas.addEventListener("click", open_fullscreen);

		// capture mouse position when we move the mouse
		this.canvas.addEventListener("mousemove", on_mouse_move);

		// reset the position when we leave the canvas
		this.canvas.addEventListener("mouseleave", on_mouse_leave);

		// capture keys
		window.addEventListener("keydown", keydown_handler, true);
		window.addEventListener("keyup", keyup_handler, true);
	},

	// fills a rect with the given color
	fill_rect : function(color, x, y, width, height)
	{
		this.context.fillStyle = color;
		this.context.fillRect(x, y, width, height);
	},

	// actually draws the game
	draw : function()
	{
		// draw fps
		this.context.fillStyle = "White";
        this.context.font      = "normal 16pt Arial";
        this.context.fillText(fps.tick() + " fps", 0, 16);

        // get the deltatime
        this.last_delta = fps.get_last_delta() * (this.canvas.width / 1280.0);

        // store the old ball position
        this.ball.old_x = this.ball.x;
        this.ball.old_y = this.ball.y;

        // move the left paddle
		let left_paddle_move_to_calculated_position =
            this.left_paddle.is_cpu &&
            this.left_paddle.calculated_y != -1 &&
            !this.left_paddle.calculated_position_set &&
            this.difficultymanager.get_current_difficulty().should_paddle_go_to_calculated_position(this.canvas.width, this.ball.x, true);

        this.set_paddle_direction(this.left_paddle, left_paddle_move_to_calculated_position);
        this.move_paddle(this.left_paddle, 0.5, 1.0, left_paddle_move_to_calculated_position);

        // move the right paddle
		let right_paddle_move_to_calculated_position =
            this.right_paddle.is_cpu &&
            this.right_paddle.calculated_y != -1 &&
            !this.right_paddle.calculated_position_set &&
            this.difficultymanager.get_current_difficulty().should_paddle_go_to_calculated_position(this.canvas.width, this.ball.x, false);

        this.set_paddle_direction(this.right_paddle, right_paddle_move_to_calculated_position);
        this.move_paddle(this.right_paddle, 0.5, 1.0, right_paddle_move_to_calculated_position);

        // move the ball
        let paddle_hit = this.move_ball();

        // check if we need to calculate the position where the ball will land on the other side
        if (paddle_hit)
        {
        	let target_paddle = this.ball.speed_x > 0.0 ? this.right_paddle : this.left_paddle;

        	if (target_paddle.is_cpu)
        	{
        		let current_difficulty = this.difficultymanager.get_current_difficulty();

        		// only calculate if needed
        		if (current_difficulty.calculated_pos_moving_chance > 0.0)
        		{
					let old_calculated_y = target_paddle.calculated_y;
                    let old_clamped_calculated_y = target_paddle.calculated_y_clamped;
                    let old_ball_x = this.ball.x;
                    let old_ball_y = this.ball.y;
                    let old_ball_speed_x = this.ball.speed_x;
                    let old_ball_speed_y = this.ball.speed_y;
                    let last_ball_y = this.ball.y;

                    // move the ball until it hits the other side
                    while (true)
                    {
                        if (this.move_ball(true))
                        {
                            // average it out
                            target_paddle.calculated_y = (this.ball.y + last_ball_y) / 2;

                            break;
                        }

                        last_ball_y = this.ball.y;
                    }

                    this.ball.x = old_ball_x;
                    this.ball.y = old_ball_y;
                    this.ball.speed_x = old_ball_speed_x;
                    this.ball.speed_y = old_ball_speed_y;

                    if (target_paddle.calculated_y != old_calculated_y)
                    {
                        // clamp the new calculated y
                        let size = Math.ceil(target_paddle.size.height / 2);

                        target_paddle.calculated_y_clamped = Math.max(target_paddle.calculated_y, size);
                        target_paddle.calculated_y_clamped = Math.min(target_paddle.calculated_y_clamped, (this.canvas.height - size) - 1);

                        if (target_paddle.calculated_y_clamped != old_clamped_calculated_y)
                        {
                            // since the position changed, we're no longer in the right position
                            target_paddle.calculated_position_set = false;
                        }
                    }

                    // generate new random numbers for the cpu difficulty
                    current_difficulty.generate_numbers();

                    // set the paddle speed
                    target_paddle.speed = target_paddle.base_speed_scaled * current_difficulty.current_paddle_speed_multiplier;
        		}
        	}
        }

        // draw the ball
        this.ball.draw();

        // draw the paddles
        this.left_paddle.draw();
        this.right_paddle.draw();
	},

	// clears the canvas
	clear : function()
	{
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.fill_rect(this.background_color, 0, 0, this.canvas.width, this.canvas.height);
	},

	// function to move our ball
	// returns true if one side
	// scored a point
	move_ball : function(calculate_only = false)
	{
		let paddle_hit = false;

		// move it
		this.ball.x += this.ball.speed_x * this.last_delta;
		this.ball.y += this.ball.speed_y * this.last_delta;

		// clamp the X value
		this.ball.x = Math.max(this.ball.ball_size / 2, this.ball.x);
		this.ball.x = Math.min(this.canvas.width - (this.ball.ball_size) / 2 - 1, this.ball.x);

		if (this.ball.y < this.ball.ball_size / 2)
		{
			// if the ball hits the ceiling, send it back down
			this.ball.y = this.ball.ball_size / 2;
			this.ball.speed_y *= -1.0;
		}
		else if (this.ball.y > this.canvas.height - this.ball.ball_size / 2)
		{
			// if the ball hits the bottom, send it back up
			this.ball.y = (this.canvas.height - 1) - this.ball.ball_size / 2;
			this.ball.speed_y *= -1.0;
		}

		// check if the ball hits a paddle
		if (calculate_only)
		{
			if ((this.ball.speed_x > 0.0 && this.ball.x >= this.right_paddle.x) ||
				(this.ball.speed_x < 0.0 && this.ball.x <= this.left_paddle.x + this.left_paddle.size.width)) return true;
		}
		else
		{
			// check if the new position hits a paddle
			if ((this.ball.speed_x > 0.0 && this.right_paddle.intersect(this.ball)) || (this.ball.speed_x < 0.0 && this.left_paddle.intersect(this.ball)))
			{
				paddle_hit = true;

				// revert the X direction
				this.ball.speed_x *= -1.0;

				// add a spin to it if our paddle is moving
				let paddle = (this.ball.speed_x < 0.0) ? this.right_paddle : this.left_paddle;

				if (paddle.direction != paddle.directions.none)
				{
					// multiply the paddle speed with the distance between the ball hitting and the center of the paddle
                    let ball_y = this.ball.y;

                    ball_y = Math.max(ball_y, paddle.y);
                    ball_y = Math.min(ball_y, paddle.y + paddle.size.height);

                    // (?) do we want abs here?
                    let mult = 1.0 + Math.abs((ball_y - (paddle.y + paddle.size.height / 2)) / (paddle.size.height / 2));

                    this.ball.speed_y = paddle.speed * mult;
				}
			}
		}

		// check if the ball leaves the playing field (one side lost)
		if (calculate_only) return false;

		if (!paddle_hit)
		{
			if (this.ball.x <= Math.ceil(this.ball.ball_size / 2) + 1)
			{
				// hit left side
				this.right_paddle.reset(++this.right_paddle.points);
				this.left_paddle.reset(this.left_paddle.points);
				this.ball.reset(this.right_paddle.points + this.left_paddle.points);

				// TODO: timeout?
			}
			else if (this.ball.x + Math.ceil(this.ball.ball_size / 2) >= this.canvas.width - 1)
			{
				// hit right side
				this.right_paddle.reset(this.right_paddle.points);
				this.left_paddle.reset(++this.left_paddle.points);
				this.ball.reset(this.right_paddle.points + this.left_paddle.points);

				// TODO: timeout?
			}
		}

		return paddle_hit;
	},

	// handles keyboard events, code = key, down = if the key is down or up
	handle_key : function(code, down)
	{
		if (code == "KeyW" || code == "KeyS" || code == "ArrowUp" || code == "ArrowDown")
		{
			let control_key = this.control_keys.keys.down;

			if (code == "KeyS") control_key = this.control_keys.keys.s;
			else if (code == "KeyW") control_key = this.control_keys.keys.w;
			else if (code == "ArrowUp") control_key = this.control_keys.keys.up;

			this.control_keys.pressed[control_key] = down;

			if (down)
			{
				this.control_keys.down_time[control_key] = performance.now();

				return true;
			}
		}

		return false;
	},

	// moves a paddle
	move_paddle : function(paddle, min_position_multiplier, end_multiplier, target_calculated = false)
	{
		paddle.moving_to_calculated_position = target_calculated;

		// check if we want to move it
		if ((paddle.direction == paddle.directions.none && !target_calculated) || (target_calculated && paddle.calculated_position_set)) return;

		// our base paddle speed
		let base_paddle_speed = paddle.base_speed_scaled;

		// set our paddle speed
		if (!target_calculated)
		{
			// normal
			paddle.speed = (paddle.direction == paddle.directions.down) ? base_paddle_speed : -base_paddle_speed;
		}
		else
		{
			// cpu (calculated)
			let center_y = paddle.y + paddle.size.height / 2;

			paddle.speed = (center_y > paddle.calculated_y) ? -base_paddle_speed : base_paddle_speed;
			paddle.direction = (center_y > paddle.calculated_y) ? paddle.directions.up : paddle.directions.down;
		}

		if (min_position_multiplier < 1.0)
		{
			let calc = (!target_calculated) ? this.ball.y : paddle.calculated_y;
			let pos = paddle.y + paddle.size.height / 2;
			let div = (pos <= calc) ? pos / calc : calc / pos;

			paddle.speed *= (min_position_multiplier + ((1.0 - div) * (1.0 - min_position_multiplier)) * end_multiplier);
		}

		// calculate new paddle coordinates
		let new_y = paddle.y + paddle.speed * this.last_delta;

		// don't let our paddle get outside of our area
		new_y = Math.max(new_y, 0.0);
		new_y = Math.min(new_y, (this.canvas.height - 1) - paddle.size.height);

		// now, set the paddle position (height)
		if (target_calculated)
		{
			// prevent cpu paddle from flickering up and down
			let old_center_y = paddle.y + paddle.size.height / 2;
			let new_center_y = new_y + paddle.size.height / 2;

			if ((old_center_y <= paddle.calculated_y_clamped && new_center_y >= paddle.calculated_y_clamped) || (old_center_y >= paddle.calculated_y_clamped && new_center_y <= paddle.calculated_y_clamped))
			{
				new_y = paddle.calculated_y_clamped - paddle.size.height / 2;

				// don't let our paddle get outside of our area
				new_y = Math.max(new_y, 0.0);
				new_y = Math.min(new_y, (this.canvas.height - 1) - paddle.size.height);

				// reset the direction since it's done moving
				paddle.direction = paddle.directions.none;

				// tell the cpu that we've hit the proper position
				paddle.calculated_position_set = true;
			}
		}

		// apply the new position
		paddle.y = new_y;
	},

	// sets the direction for a cpu paddle
	set_cpu_paddle_direction : function(paddle, move_to_calculated_position)
	{
		if (!paddle.is_cpu) return;

		paddle.direction = paddle.directions.none;

		if (paddle.calculated_position_set) return;

		let current_ball_y = move_to_calculated_position ? paddle.calculated_y : this.ball.y;

		if ((paddle.left && this.ball.speed_x > 0.0) || (!paddle.left && this.ball.speed_x < 0.0)) return;

		let center = paddle.y + paddle.size.height / 2;
		let clipped_screen = 	(paddle.y == 0 && current_ball_y <= paddle.size.height) ||
								(paddle.y >= (this.canvas.height - 1) - paddle.size.height && current_ball_y >= paddle.y);

		if (!clipped_screen && Math.abs(center - current_ball_y) > 5.0) paddle.direction = (center > current_ball_y) ? paddle.directions.up : paddle.directions.down;
	},

	// sets the direction for a player paddle
	set_player_paddle_direction : function(paddle, up_key, down_key)
	{
		let up_pressed = this.control_keys.is_pressed(up_key);
		let down_pressed = this.control_keys.is_pressed(down_key);

		if ((up_pressed || down_pressed) && paddle.is_cpu) paddle.is_cpu = false;

		if (!up_pressed && down_pressed)
        {
            paddle.direction = paddle.directions.down;
        }
        else if (!down_pressed && up_pressed)
        {
            paddle.direction = paddle.directions.up;
        }
        else if (down_pressed && up_pressed)
        {
        	let now = performance.now();

            paddle.direction = (this.control_keys.get_time_delta(down_key, now) < this.control_keys.get_time_delta(up_key, now)) ? paddle.directions.down : paddle.directions.up;
        }
        else
        {
            paddle.direction = paddle.directions.none;
        }
	},

	// sets the direction of a paddle (handles both - cpus and players)
	set_paddle_direction : function(paddle, move_to_calculated_position)
	{
		this.set_player_paddle_direction(paddle, paddle.left ? this.control_keys.keys.w : this.control_keys.keys.up, paddle.left ? this.control_keys.keys.s : this.control_keys.keys.down);
		this.set_cpu_paddle_direction(paddle, move_to_calculated_position);
	},

	set_mouse_pos : function(event)
	{
	    let rect = this.canvas.getBoundingClientRect();

	    this.mouse_position.x = (event.clientX - rect.left) / (rect.right - rect.left) * this.canvas.width;
	   	this.mouse_position.y = (event.clientY - rect.top) / (rect.bottom - rect.top) * this.canvas.height;
	},

	invalidate_mouse_pos : function()
	{
		this.mouse_position.x = this.mouse_position.y = -1;
	}

};

// called when the page loads
function on_load()
{
	game.start();
}

// called when the game area should update
function update_game_area()
{
	// clear and draw the game
	game.clear();
	game.draw();

	// request another animation frame
	game.anim_frame = window.requestAnimationFrame(update_game_area);
}

// called when there was a key pressed
function keydown_handler(event)
{
	if (event.defaultPrevented) return;
	if (game.handle_key(event.code, true)) return;

	// cancel the default action to avoid it being handled twice
	event.preventDefault();
}

// called when there was a key released
function keyup_handler(event)
{
	game.handle_key(event.code, false);
}

function on_mouse_down(event)
{

}

function on_mouse_up(event)
{

}

function on_mouse_move(event)
{
	game.set_mouse_pos(event);
}

function on_mouse_leave(event)
{
	game.invalidate_mouse_pos();
}
# pip install -i https://pypi.tuna.tsinghua.edu.cn/simple

import random
import turtle as t
from freegames import square, vector

# 1. square
# t.hideturtle()
# t.tracer(False)
# square(0, 0, 10, 'green')
# t.update()
# t.done()

# 2. snake
# t.hideturtle()
# t.tracer(False)
# square(0, 0, 10, 'green')          # CHANGE: draw 3 squares to form snake body
# square(-10, 0, 10, 'green')        # NEW: second segment
# square(-20, 0, 10, 'green')        # NEW: third segment
# t.update()
# t.done()

# 3. snake list and vector
# CHANGE: Use list to store snake body, use vector for 2D coordinates
# snake = []                          # NEW: list to store snake segments
# BLOCK = 12                           # NEW: size of each segment
# RADIUS = BLOCK * 25                  # NEW: game window radius
#
# def init_snake():                    # NEW: function to initialize snake
#     snake.clear()
#     snake.append(vector(0, 0))       # NEW: first segment at origin
#     snake.append(vector(-BLOCK, 0))  # NEW: second segment
#     snake.append(vector(-BLOCK * 2, 0)) # NEW: third segment
#
#     draw_snake()
#
# def draw_snake():                    # NEW: function to draw snake from list
#     for i in snake:
#         square(i.x, i.y, BLOCK - 2, 'green')
#
# t.setup(RADIUS * 2, RADIUS * 2, 0, 0) # NEW: setup window with RADIUS
# t.hideturtle()
# t.tracer(False)
#
# init_snake()
#
# t.update()
# t.done()

# 4. snake move
# CHANGE: Add automatic movement - snake moves continuously
# snake = []
# BLOCK = 12
# RADIUS = BLOCK * 25
#
# def init_snake():
#     snake.clear()
#     snake.append(vector(0, 0))
#     snake.append(vector(-BLOCK, 0))
#     snake.append(vector(-BLOCK * 2, 0))
#
#     draw_snake()
#
# def draw_snake():
#     for i in snake:
#         square(i.x, i.y, BLOCK - 2, 'green')
#
# def move():                            # NEW: function to move snake
#     head = vector(snake[0].x + BLOCK, snake[0].y)  # NEW: calculate new head position
#     snake.insert(0, head)              # NEW: add new head
#     snake.pop()                        # NEW: remove tail to simulate movement
#
#     t.clear()
#     draw_snake()
#     t.update()
#
#     t.ontimer(move, 200)               # NEW: repeat move every 200ms
#
# t.setup(RADIUS * 2, RADIUS * 2, 0, 0)
# t.hideturtle()
# t.tracer(False)
#
# init_snake()
# move()                                # NEW: start movement
#
# t.update()
# t.done()

# 5. key event
# CHANGE: Add keyboard event listener - respond to arrow keys
# snake = []
# BLOCK = 12
# RADIUS = BLOCK * 25
#
# def init_snake():
#     snake.clear()
#     snake.append(vector(0, 0))
#     snake.append(vector(-BLOCK, 0))
#     snake.append(vector(-BLOCK * 2, 0))
#
#     draw_snake()
#
# def draw_snake():
#     for i in snake:
#         square(i.x, i.y, BLOCK - 2, 'green')
#
# def move():
#     head = vector(snake[0].x + BLOCK, snake[0].y)
#     snake.insert(0, head)
#     snake.pop()
#
#     t.clear()
#     draw_snake()
#     t.update()
#
#     t.ontimer(move, 200)
#
# def on_change(key):                    # NEW: function to handle key events
#     print(key)                         # NEW: print which key was pressed
#
# t.setup(RADIUS * 2, RADIUS * 2, 0, 0)
# t.hideturtle()
# t.tracer(False)
#
# t.listen()                            # NEW: start listening for keyboard events
# t.onkey(lambda: on_change('Up'), 'Up')     # NEW: bind Up arrow key
# t.onkey(lambda: on_change('Down'), 'Down') # NEW: bind Down arrow key
# t.onkey(lambda: on_change('Left'), 'Left') # NEW: bind Left arrow key
# t.onkey(lambda: on_change('Right'), 'Right') # NEW: bind Right arrow key
#
# init_snake()
# move()
#
# t.update()
# t.done()

# 6. control snake
# CHANGE: Connect keyboard input to actual snake direction control
# snake = []
# BLOCK = 12
# RADIUS = BLOCK * 25
# aim = vector(0, 0)                   # NEW: direction vector (x, y)
# begin = False                        # NEW: flag to control game start
#
# def init_snake():
#     snake.clear()
#     snake.append(vector(0, 0))
#     snake.append(vector(-BLOCK, 0))
#     snake.append(vector(-BLOCK * 2, 0))
#
#     draw_snake()
#
# def draw_snake():
#     for i in snake:
#         square(i.x, i.y, BLOCK - 2, 'green')
#
# def move():
#     if begin:                         # NEW: only move when game starts
#         t.clear()
#
#         head = vector(snake[0].x + aim.x, snake[0].y + aim.y) # CHANGE: use aim vector instead of fixed BLOCK
#         snake.insert(0, head)
#         snake.pop()
#
#         draw_snake()
#         t.update()
#
#         t.ontimer(move, 200)
#
# def on_change(x, y):                 # CHANGE: accept x, y parameters to set direction
#     global begin
#     if aim.x != -x or aim.y != -y:   # NEW: prevent 180-degree turn
#         aim.x = x
#         aim.y = y
#
#     if not begin:                     # NEW: start game on first key press
#         begin = True
#         move()
#
# t.setup(RADIUS * 2, RADIUS * 2, 0, 0)
# t.hideturtle()
# t.tracer(False)
#
# t.listen()
# t.onkey(lambda: on_change(0, BLOCK), 'Up')    # CHANGE: pass direction values
# t.onkey(lambda: on_change(0, -BLOCK), 'Down')
# t.onkey(lambda: on_change(-BLOCK, 0), 'Left')
# t.onkey(lambda: on_change(BLOCK, 0), 'Right')
#
# init_snake()
# REMOVE: move() is now called when arrow key is pressed
#
# t.update()
# t.done()

# 7. draw food
# CHANGE: Add food items that appear randomly on screen
# snake = []
# BLOCK = 12
# RADIUS = BLOCK * 25
# aim = vector(0, 0)
# begin = False
# food = []                             # NEW: list to store food positions
#
# def init_snake():
#     snake.clear()
#     snake.append(vector(0, 0))        # CHANGE: start with single segment
#
#     draw_snake()
#
# def draw_snake():
#     for i in snake:
#         square(i.x, i.y, BLOCK - 2, 'green')
#
# def move():
#     if begin:
#         t.clear()
#
#         head = vector(snake[0].x + aim.x, snake[0].y + aim.y)
#         snake.insert(0, head)
#         snake.pop()
#
#         draw_snake()
#         draw_food()                   # NEW: draw food in each frame
#         t.update()
#
#         t.ontimer(move, 200)
#
# def on_change(x, y):
#     global begin
#     if aim.x != -x or aim.y != -y:
#         aim.x = x
#         aim.y = y
#
#     if not begin:
#         begin = True
#         move()
#
# def draw_food():                      # NEW: function to generate and draw food
#     for i in range(10 - len(food)):  # NEW: maintain 10 food items
#         lst = random.sample(range(-RADIUS, RADIUS - BLOCK, BLOCK), 2) # NEW: random position
#         food.append(vector(lst[0], lst[1])) # NEW: add to food list
#     for j in food:
#         square(j.x, j.y, BLOCK - 2, 'blue') # NEW: draw food as blue squares
#
# t.setup(RADIUS * 2, RADIUS * 2, 0, 0)
# t.hideturtle()
# t.tracer(False)
#
# t.listen()
# t.onkey(lambda: on_change(0, BLOCK), 'Up')
# t.onkey(lambda: on_change(0, -BLOCK), 'Down')
# t.onkey(lambda: on_change(-BLOCK, 0), 'Left')
# t.onkey(lambda: on_change(BLOCK, 0), 'Right')
#
# init_snake()
# draw_food()                           # NEW: draw food initially
#
# t.update()
# t.done()

# 8. eat food
# CHANGE: Snake can eat food and grow longer, speed increases with length
# snake = []
# BLOCK = 12
# RADIUS = BLOCK * 25
# aim = vector(0, 0)
# begin = False
# food = []
#
# def init_snake():
#     snake.clear()
#     snake.append(vector(0, 0))
#
#     draw_snake()
#
# def draw_snake():
#     for i in snake:
#         square(i.x, i.y, BLOCK - 2, 'green')
#
# def move():
#     if begin:
#         t.clear()
#
#         head = vector(snake[0].x + aim.x, snake[0].y + aim.y)
#         snake.insert(0, head)
#
#         if head in food:               # CHANGE: if snake eats food, don't pop tail (grow longer)
#             food.remove(head)
#         else:
#             snake.pop()               # CHANGE: normal movement (pop tail)
#
#         draw_snake()
#         draw_food()
#
#         t.update()
#         t.ontimer(move, 300 // len(snake)) # CHANGE: speed up as snake grows
#
# def on_change(x, y):
#     global begin
#     if aim.x != -x or aim.y != -y:
#         aim.x = x
#         aim.y = y
#
#     if not begin:
#         begin = True
#         move()
#
# def draw_food():
#     for i in range(10 - len(food)):
#         lst = random.sample(range(-RADIUS, RADIUS - BLOCK, BLOCK), 2)
#         food.append(vector(lst[0], lst[1]))
#     for j in food:
#         square(j.x, j.y, BLOCK - 2, 'blue')
#
# t.setup(RADIUS * 2, RADIUS * 2, 0, 0)
# t.hideturtle()
# t.tracer(False)
#
# t.listen()
# t.onkey(lambda: on_change(0, BLOCK), 'Up')
# t.onkey(lambda: on_change(0, -BLOCK), 'Down')
# t.onkey(lambda: on_change(-BLOCK, 0), 'Left')
# t.onkey(lambda: on_change(BLOCK, 0), 'Right')
#
# init_snake()
# draw_food()
#
# t.update()
# t.done()

# 9. game over
# CHANGE: Add boundary detection and game over functionality
# snake = []
# BLOCK = 12
# RADIUS = BLOCK * 25
# aim = vector(0, 0)
# begin = False
# food = []
#
# def init_snake():
#     snake.clear()
#     snake.append(vector(0, 0))
#
#     draw_snake()
#
# def draw_snake():
#     for i in snake:
#         square(i.x, i.y, BLOCK - 2, 'green')
#
# def move():
#     if begin:
#         t.clear()
#
#         head = vector(snake[0].x + aim.x, snake[0].y + aim.y)
#         snake.insert(0, head)
#
#         if head in food:
#             food.remove(head)
#         elif head.x < -RADIUS or head.x > RADIUS - BLOCK or head.y < -RADIUS or head.y > RADIUS - BLOCK: # NEW: check boundary collision
#             game_over()                    # NEW: trigger game over
#         else:
#             snake.pop()
#
#         draw_snake()
#         draw_food()
#
#         t.update()
#         t.ontimer(move, 300 // len(snake))
#
# def on_change(x, y):
#     global begin
#     if aim.x != -x or aim.y != -y:
#         aim.x = x
#         aim.y = y
#
#     if not begin:
#         begin = True
#         move()
#
# def draw_food():
#     for i in range(10 - len(food)):
#         lst = random.sample(range(-RADIUS, RADIUS - BLOCK, BLOCK), 2)
#         x = vector(lst[0], lst[1])
#         if x not in snake:                # NEW: don't spawn food on snake body
#             food.append(x)
#     for j in food:
#         square(j.x, j.y, BLOCK - 2, 'blue')
#
# def game_over():                          # NEW: game over function
#     global begin
#     aim.x, aim.y = 0, 0                  # NEW: stop snake movement
#     t.penup()
#     t.goto(0, 0)
#     t.pendown()
#     t.pencolor('red')
#     t.write('Game Over!', align='center', font=('Arial', 24, 'normal')) # NEW: display game over message
#     begin = False                        # NEW: reset game state
#
# t.setup(RADIUS * 2, RADIUS * 2, 0, 0)
# t.hideturtle()
# t.tracer(False)
#
# t.listen()
# t.onkey(lambda: on_change(0, BLOCK), 'Up')
# t.onkey(lambda: on_change(0, -BLOCK), 'Down')
# t.onkey(lambda: on_change(-BLOCK, 0), 'Left')
# t.onkey(lambda: on_change(BLOCK, 0), 'Right')
#
# init_snake()
# draw_food()
#
# t.update()
# t.done()

# 10. restart game
# CHANGE: Add restart functionality - press 'r' to restart after game over
# snake = []
# BLOCK = 12
# RADIUS = BLOCK * 25
# aim = vector(0, 0)
# begin = False
# food = []
#
# def init_snake():
#     snake.clear()
#     snake.append(vector(0, 0))
#
#     draw_snake()
#
# def draw_snake():
#     for i in snake:
#         square(i.x, i.y, BLOCK - 2, 'green')
#
# def move():
#     if begin:
#         t.clear()
#
#         head = vector(snake[0].x + aim.x, snake[0].y + aim.y)
#         snake.insert(0, head)
#
#         if head in food:
#             food.remove(head)
#         elif head.x < -RADIUS or head.x > RADIUS - BLOCK or head.y < -RADIUS or head.y > RADIUS - BLOCK:
#             game_over()               # CHANGE: game over, snake length unchanged
#         else:
#             snake.pop()
#
#         draw_snake()
#         draw_food()
#
#         t.update()
#         t.ontimer(move, 300 // len(snake))
#
# def on_change(x, y):
#     global begin
#     if aim.x != -x or aim.y != -y:
#         aim.x = x
#         aim.y = y
#
#     if not begin:
#         begin = True
#         move()
#
# def draw_food():
#     for i in range(10 - len(food)):
#         lst = random.sample(range(-RADIUS, RADIUS - BLOCK, BLOCK), 2)
#         x = vector(lst[0], lst[1])
#         if x not in snake:
#             food.append(x)
#     for j in food:
#         square(j.x, j.y, BLOCK - 2, 'blue')
#
# def game_over():
#     global begin
#     aim.x, aim.y = 0, 0
#     t.penup()
#     t.goto(0, 0)
#     t.pendown()
#     t.pencolor('red')
#     t.write('Game Over!', align='center', font=('Arial', 24, 'normal'))
#     begin = False
#
# def restart():                         # NEW: restart function
#     t.clear()                          # NEW: clear screen
#     init_snake()                       # NEW: reset snake position
#     food.clear()                        # NEW: clear food
#     draw_food()                        # NEW: redraw food
#
# t.setup(RADIUS * 2, RADIUS * 2, 0, 0)
# t.hideturtle()
# t.tracer(False)
#
# t.listen()
# t.onkey(lambda: on_change(0, BLOCK), 'Up')
# t.onkey(lambda: on_change(0, -BLOCK), 'Down')
# t.onkey(lambda: on_change(-BLOCK, 0), 'Left')
# t.onkey(lambda: on_change(BLOCK, 0), 'Right')
# t.onkey(restart, 'r')                   # NEW: bind 'r' key to restart
#
# init_snake()
# draw_food()
#
# t.update()
# t.done()

# 11. score
# CHANGE: Add score display, fix restart bug (multiple timers and arrow keys after game over)
snake = []
BLOCK = 12
RADIUS = BLOCK * 25
aim = vector(0, 0)
begin = False
food = []
game_over_flag = False               # NEW: flag to prevent arrow keys after game over

def init_snake():
    snake.clear()
    snake.append(vector(0, 0))

    draw_snake()

def draw_snake():
    for i in snake:
        square(i.x, i.y, BLOCK - 2, 'green')

def move():
    if begin:
        t.clear()

        head = vector(snake[0].x + aim.x, snake[0].y + aim.y)
        snake.insert(0, head)

        if head in food:
            food.remove(head)
        elif head.x < -RADIUS or head.x > RADIUS - BLOCK or head.y < -RADIUS or head.y > RADIUS - BLOCK:
            game_over()
            snake.pop()               # CHANGE: reset snake length after game over
        else:
            snake.pop()

        draw_snake()
        draw_food()
        show_score()                  # NEW: update score display

        t.update()
        t.ontimer(move, 300 // len(snake))

def on_change(x, y):
    global begin, game_over_flag
    if game_over_flag:                # NEW: ignore direction keys after game over
        return
    if aim.x != -x or aim.y != -y:
        aim.x = x
        aim.y = y

    if not begin:
        begin = True
        move()

def draw_food():
    for i in range(10 - len(food)):
        lst = random.sample(range(-RADIUS, RADIUS - BLOCK, BLOCK), 2)
        x = vector(lst[0], lst[1])
        if x not in snake:
            food.append(x)
    for j in food:
        square(j.x, j.y, BLOCK - 2, 'blue')

def game_over():
    global begin, game_over_flag
    aim.x, aim.y = 0, 0
    t.penup()
    t.goto(0, 0)
    t.pendown()
    t.pencolor('red')
    t.write('Game Over!', align='center', font=('Arial', 24, 'normal'))
    begin = False
    game_over_flag = True             # NEW: set flag to block arrow keys

def restart():
    global begin, game_over_flag
    begin = False                     # CHANGE: stop current movement (fix multiple timers bug)
    t.clear()
    init_snake()
    food.clear()
    draw_food()
    show_score()                      # NEW: redraw score after restart
    game_over_flag = False           # NEW: reset flag to allow arrow keys

def show_score():                    # NEW: function to display score
    t.penup()
    t.goto(RADIUS - 75, RADIUS - 30)
    t.pendown()
    t.pencolor('orange')
    t.write(f'Score: {len(snake) - 1}', font=('Arial', 10, 'normal'))


t.setup(RADIUS * 2, RADIUS * 2, 0, 0)
t.hideturtle()
t.tracer(False)

t.listen()
t.onkey(lambda: on_change(0, BLOCK), 'Up')
t.onkey(lambda: on_change(0, -BLOCK), 'Down')
t.onkey(lambda: on_change(-BLOCK, 0), 'Left')
t.onkey(lambda: on_change(BLOCK, 0), 'Right')
t.onkey(restart, 'r')

init_snake()
draw_food()
show_score()                         # NEW: show score initially

t.update()
t.done()







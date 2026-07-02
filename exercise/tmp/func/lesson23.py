# 1. 函数引用
def add(a, b):
    return a + b
print(add)
print(add(2, 3))

func = add
print(func)
print(func(2, 3))

def execute_func(func, *args):
    return func(*args)

def add(a, b, c = 0):
    return a + b + c

def multiply(a, b):
    return a * b

def power(a, b):
    return a ** b

print(execute_func(add, 1, 2, 3))
print(execute_func(multiply, 4, 5))
print(execute_func(power, 5, 3))

# 常用的一些案例
# map函数

# map函数可以将一个函数作用到一个可迭代对象的每个元素上，返回一个新的可迭代对象
# 语法：map(func, *iterables)
# 参数：
# func：要作用的函数
# iterables：要迭代的对象，可以是多个，用逗号隔开
# 返回值：
# 一个新的可迭代对象，每个元素都是func作用到iterables的每个元素上的结果
# 注意：
# map函数返回的是一个map对象，需要使用list()函数将其转换为列表

# 这是一个常用的方式，从输入中读取一行数字的字符串，以空格分开，然后将其转换为一个整数列表
# s = list(map(int, input().split()))
# print(s)

# 这里int是一个函数引用，也可以定义自己的函数
def square(x):
    return x ** 2

l1 = [i for i in range(10)]
print(l1)
l2 = list(map(square, l1))
print(l2)

# lambda (anonymous functions)
# One-line minimalistic functions used for simple operations, 
# avoiding the overhead of defining a full def function
# 语法是冒号前面是参数，后面是返回值
# add = lambda a, b: a + b
# print(add(2, 3))

# 上面的例子square可以改成：
l3 = list(map(lambda x: x ** 2, l1))
print(l3)

# 2. Thread
# A simple sample
import time
import threading

d = {}

def callback(name=''):
    d[name] = 0
    while True:
        d[name] += 1
        print('I am a thread~~~' + name + ' ' + str(d[name]))
        time.sleep(5)

def new_task(name):
    new_thread = threading.Thread(target=callback, args=(name,), daemon=True)
    new_thread.start()

while True:
    a = input('a: ')
    print(a)
    if a == 'exit':
        print('all threads stopped')
        break
    new_task(a)

# 下面是练习
def double(lst):
    for i in range(len(lst)):
        lst[i] *= 2
    return lst

# l = [i for i in range(5)]
# print(double(l))

def reverse(lst):
    new_lst = []
    for i in range(-1, -len(lst) - 1, -1):
        new_lst.append(lst[i])
    return new_lst

# l = [i for i in range(5)]
# print(reverse(l))

# 下面是一道题的2个解法，给2个时间，然后算出它们之间的差值
def get_time(h1, m1, h2, m2):
    t1 = h1 * 60 + m1
    t2 = h2 * 60 + m2

    t = t2 - t1
    print(t // 60, t % 60)

# times = input('time: ').split()
# change_type(times)
# print(times)

# get_time(times[0], times[1], times[2], times[3])

def get_time(h1, m1, h2, m2):
    if m2 < m1:
        m = m2 - m1 + 60
        h = h2 - h1 - 1
    else:
        m = m2 - m1
        h = h2 - h1

    print(h, m)

# a, b, c, d = map(int, input('time: ').split())
# get_time(a, b, c, d)



import math

class Vector3:
    def __init__(self, x=0, y=0, z=0):
        self.x = x
        self.y = y
        self.z = z

    def __sub__(self, other):
        return Vector3(self.x - other.x, self.y - other.y, self.z - other.z)

    def __add__(self, other):
        return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)

    def __mul__(self, scalar):
        return Vector3(self.x * scalar, self.y * scalar, self.z * scalar)

    def length(self):
        return math.sqrt(self.x * self.x + self.y * self.y + self.z * self.z)

    def normalize(self):
        l = self.length()
        if l == 0:
            return Vector3(0, 0, 0)
        return Vector3(self.x / l, self.y / l, self.z / l)

    def distance_to(self, other):
        return (self - other).length()

    def dot(self, other):
        return self.x * other.x + self.y * other.y + self.z * other.z

    def clone(self):
        return Vector3(self.x, self.y, self.z)

    def copy(self):
        return Vector3(self.x, self.y, self.z)

    def to_list(self):
        return [self.x, self.y, self.z]
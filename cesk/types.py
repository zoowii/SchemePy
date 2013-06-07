class SObject(object):
    def to_str(self):
        return str(self)


class SBaseValue(SObject):
    pass


class SNumber(SBaseValue):
    def __init__(self, number):
        self.number = number

    def __repr__(self):
        return str(self.number)


class SBoolean(SBaseValue):
    def __init__(self, value):
        self.value = value

    def __repr__(self):
        if self.value:
            return 'true'
        else:
            return 'false'


class SString(SBaseValue):
    def __init__(self, str):
        self.str = str

    def __repr__(self):
        return self.str


class SIdentifier(SObject):
    def __init__(self, str):
        self.str = str

    def __repr__(self):
        return "'%s" % self.str


class SList(SObject):
    def __init__(self, items):
        self.items = items

    def __init__(self):
        self.items = []

    def add(self, item):
        self.items.append(item)

    def __len__(self):
        return len(self.items)

    def __getitem__(self, item):
        return self.items[item]

    def __repr__(self):
        str = '('
        for i in range(len(self)):
            item = self[i]
            if i > 0:
                str += ' '
            str += repr(item)
        str += ')'
        return str


class SExprList(SObject):
    def __init__(self, expressions):
        self.items = expressions

    def __init__(self):
        self.items = []

    def add(self, item):
        self.items.append(item)

    def __len__(self):
        return len(self.items)

    def __getitem__(self, item):
        return self.items[item]

    def __repr__(self):
        str = '['
        for i in range(len(self)):
            item = self[i]
            if i > 0:
                str += ' '
            str += repr(item)
        str += ']'
        return str

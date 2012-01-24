var net = require('net');

var client, partial, total = 0,
data;

client = net.connect(8000, function() {
	console.log('client connected');
	client.write('init password=test,compression=off\n');
	//client.write('info version\n');
	//client.write('input irc.freenode.#testfrest hello guys!\n');
	//client.write('sync\n');
	//client.write('hdata buffer:gui_buffers(*) number,name\n');
	//client.write('hdata buffer:gui_buffers(*)/lines/first_line(*)/data\n');
	//client.write('input core.weechat /help filter\n');
	//client.write('hdata buffer *\n');
	client.write('hdata buffer:gui_buffers(*) number,name\n');
});

client.on('data', function(part) {
	var compress, id;
	data = part;

	if (total === 0) {
		total = getInt();
		compress = getCompression();
		id = getString();

		total -= (9 + id.length);
		partial = data;
	} else {
		partial += data;
	}

	if (partial.length >= total) {
		data = partial;
		total = 0;
		partial = '';
		var ret = parse();
        console.log('RET', ret);
	}
});

client.on('end', function() {
	console.log('client disconnected');
});

var hack = {
	hda: getHdata,
	str: getString,
	int: getInt
};

function parse() {
	var type = data.slice(0, 3);
	data = data.slice(3);

	if (!hack[type]) {
		console.log('OMGOMGOGMOMGOGMOMG ' + type);
	}

	return hack[type] && hack[type]();
}

function getCompression() {
	var c = data[0];
	data = data.slice(1);
	return c;
}

function getInt() {
	var l = ((data[0] & 0xff) << 24) | ((data[1] & 0xff) << 16) | ((data[2] & 0xff) << 8) | (data[3] & 0xff);
	data = data.slice(4);
	return l > 0 ? l: null;
}

function getString() {
	var l = getInt();
	s = data.slice(0, l);
	data = data.slice(l);
	return s.toString();
}

function getPointer() {
    var l = data[0],
    pointer = data.slice(1, l + 1);
    data = data.slice(l + 1);
    return pointer;
}

function getHdata() {
	var i, p, tmp, obj = {},
	hpath = getString(),
	keys = getString().split(','),
	count = getInt(),
    objs = [];

    keys = keys.map(function(key) {
        return key.split(':');
    });

    for (i = 0; i < count; i++ ) {
        p = getPointer();
        tmp = {};
        keys.forEach(function(key) {
            tmp[key[0]] = hack[key[1]]();
        });
        objs.push(tmp);
    }
    obj.objects = objs;

	return obj;
}

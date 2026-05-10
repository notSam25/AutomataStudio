const mongoose = require('mongoose');

const mask = (uri) => {
  if (!uri) return '<<not set>>';
  try { return uri.replace(/:\/\/.*@/, '://***:***@'); } catch (e) { return uri; }
};

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/automata-studio';

(async () => {
  console.log('Testing MongoDB connection to:', mask(uri));

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });

    console.log('MongoDB connected successfully');

    const db = mongoose.connection.db;
    const cols = await db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name));

    const col = db.collection('test_perm');
    await col.insertOne({ ok: 1, time: new Date() });
    console.log('Write succeeded');
    const doc = await col.findOne({ ok: 1 });
    console.log('Read succeeded:', doc);
    await col.drop();
    console.log('Cleanup (drop) succeeded');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('DB test failed:');
    console.error(err && err.stack ? err.stack : err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(2);
  }
})();

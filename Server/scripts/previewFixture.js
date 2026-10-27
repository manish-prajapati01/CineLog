// Local-only browser QA. Uses a disposable database and never sends email.
if(process.env.NODE_ENV!=='test')throw new Error('Set NODE_ENV=test to run isolated browser QA.');
const mongoose=require('mongoose');
const {MongoMemoryReplSet}=require('mongodb-memory-server');
const bcrypt=require('bcryptjs');
process.env.JWT_SECRET='browser-fixture-only-not-production';process.env.MAIL_TRANSPORT='test';process.env.PUBLIC_SITE_URL='http://127.0.0.1:5173';
async function run(){
 const db=await MongoMemoryReplSet.create({replSet:{count:1},binary:{version:'7.0.14'}});await mongoose.connect(db.getUri(),{dbName:'cinelog-browser-fixture'});
 const User=require('../models/User');await User.create({name:'CineLog QA',email:'qa@example.test',password:await bcrypt.hash('Fixture-password-123!',12),role:'admin'});
 const server=require('../server').listen(5001,'127.0.0.1',()=>console.log('Isolated QA API listening on 5001; fixture login qa@example.test.'));
 const stop=async()=>{server.closeAllConnections();server.close();await mongoose.disconnect();await db.stop();process.exit(0);};process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
run().catch(e=>{console.error(e.message);process.exitCode=1;});

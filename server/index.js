import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const app=express(), port=process.env.PORT||5000;
app.use(helmet({contentSecurityPolicy:false})); app.use(compression()); app.use(cors({origin:process.env.CLIENT_ORIGIN?.split(',')||true})); app.use(express.json({limit:'50kb'})); app.use(morgan(process.env.NODE_ENV==='production'?'combined':'dev'));
const categories=['Food & Dining','Transport','Shopping','Bills & Utilities','Entertainment','Health','Education','Travel','Other'];
const expenseSchema=new mongoose.Schema({title:{type:String,required:true,trim:true,maxlength:80},amount:{type:Number,required:true,min:0.01,max:100000000},category:{type:String,required:true,enum:categories},date:{type:Date,required:true},note:{type:String,trim:true,maxlength:240,default:''}},{timestamps:true});
const Expense=mongoose.model('Expense',expenseSchema);
const schema=z.object({title:z.string().trim().min(1).max(80),amount:z.coerce.number().positive().max(1e8),category:z.enum(categories),date:z.coerce.date(),note:z.string().trim().max(240).optional().default('')});
let memory=[], useMemory=false;
const sendErr=(res,e)=>res.status(e?.name==='ZodError'?400:500).json({error:e?.issues?.[0]?.message||e.message||'Something went wrong'});
app.get('/api/health',(req,res)=>res.json({status:'ok',database:useMemory?'memory-demo':mongoose.connection.readyState===1?'connected':'disconnected'}));
app.get('/api/categories',(req,res)=>res.json(categories));
app.get('/api/expenses',async(req,res)=>{try{const {search='',category='all',from,to}=req.query; if(useMemory){let rows=[...memory]; if(search) rows=rows.filter(x=>(x.title+' '+x.note).toLowerCase().includes(search.toLowerCase())); if(category!=='all') rows=rows.filter(x=>x.category===category); if(from) rows=rows.filter(x=>new Date(x.date)>=new Date(from)); if(to) rows=rows.filter(x=>new Date(x.date)<=new Date(to+'T23:59:59')); return res.json(rows.sort((a,b)=>new Date(b.date)-new Date(a.date)));} const q={}; if(search)q.$or=[{title:{$regex:search,$options:'i'}},{note:{$regex:search,$options:'i'}}]; if(category!=='all')q.category=category; if(from||to)q.date={...(from&&{$gte:new Date(from)}),...(to&&{$lte:new Date(to+'T23:59:59')})}; res.json(await Expense.find(q).sort({date:-1,createdAt:-1}).lean());}catch(e){sendErr(res,e)}});
app.post('/api/expenses',async(req,res)=>{try{const data=schema.parse(req.body); if(useMemory){const x={...data,_id:crypto.randomUUID(),createdAt:new Date()};memory.push(x);return res.status(201).json(x)} res.status(201).json(await Expense.create(data));}catch(e){sendErr(res,e)}});
app.put('/api/expenses/:id',async(req,res)=>{try{const data=schema.parse(req.body); if(useMemory){const i=memory.findIndex(x=>x._id===req.params.id);if(i<0)return res.status(404).json({error:'Expense not found'});memory[i]={...memory[i],...data};return res.json(memory[i])} const x=await Expense.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true});if(!x)return res.status(404).json({error:'Expense not found'});res.json(x)}catch(e){sendErr(res,e)}});
app.delete('/api/expenses/:id',async(req,res)=>{try{if(useMemory){memory=memory.filter(x=>x._id!==req.params.id);return res.status(204).end()} const x=await Expense.findByIdAndDelete(req.params.id);if(!x)return res.status(404).json({error:'Expense not found'});res.status(204).end()}catch(e){sendErr(res,e)}});
app.use('/api',(req,res)=>res.status(404).json({error:'Not found'}));
if(process.env.NODE_ENV==='production'){const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');app.use(express.static(dir));app.get('*',(req,res)=>res.sendFile(path.join(dir,'index.html')))}
const start=async()=>{try{if(process.env.MONGODB_URI)await mongoose.connect(process.env.MONGODB_URI);else if(process.env.ALLOW_MEMORY_DB==='true'&&process.env.NODE_ENV!=='production'){useMemory=true;console.warn('Using ephemeral memory demo database.');}else throw new Error('MONGODB_URI is required'); app.listen(port,'0.0.0.0',()=>console.log(`API on ${port}`));}catch(e){console.error(e.message);process.exit(1)}};start();

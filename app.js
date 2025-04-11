const express = require('express')
const app = express();
const cors = require("cors");

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors())
const dotenv = require('dotenv')
dotenv.config();

const connectToDb = require('./config/db');
connectToDb();



const userRouter = require('./routes/UserRoutes');
app.use('/user', userRouter);

const urlRouter = require('./routes/URLRoutes')
app.use('/url', urlRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
});

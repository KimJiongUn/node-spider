const https = require('https')
const cheerio = require('cheerio');
const fs = require('fs');

let rank = 1
let allFilms = [];//用来存储
let page = 0//从第一页开始爬取

function getDBRank(page){
    return new Promise((resolve,reject)=>{
        https.get(`https://movie.douban.com/top250?start=${page}`,(res)=>{
            let htmlData = ''
            res.on('data',(chunk)=>{
                htmlData += chunk
            })
            res.on('end',()=>{
                const $ = cheerio.load(htmlData);
                $('li .item').each(function(){
                    // this 循环时 指向当前这个电影
                    // 当前这个电影下面的title
                    // 相当于this.querySelector 
                    const title_CN = $('.title', this).eq(0).text();
                    const title_EN = $('.title', this).eq(1).text();
                    const star = $('.rating_num',this).text();
                    const pic = $('.pic img',this).attr('src');
                    allFilms.push({
                        title_CN,title_EN,star,pic,rank
                    })
                    rank++
                })
                console.log(`https://movie.douban.com/top250?start=${page}`);
                resolve(`排名第${page+1}至第${page+25}加载完毕`)
            })
        }) 
    })
}

function getResult(page){
    if(page===250){
        fs.writeFile('./films.json', JSON.stringify(allFilms),function(err){
            if(!err){
                console.log('文件写入完毕');
            }
        })
        getImages(allFilms)
    }else{
        getDBRank(page).then(res=>{
            getResult(page+25)
        })
    }
}

function getImages(imgList){
    imgList.forEach(img=>{
        https.get(img.pic,res=>{
            var imgData = ""
            res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
            res.on("data", function(chunk){
                imgData+=chunk;
            });
        
            res.on("end", function(){
                fs.writeFile(`./downImg/${img.title_CN}.png`, imgData, "binary", function(err){
                    if(err){
                        console.log("下载失败");
                    }
                });
            });
        })
    })
}

getResult(page)
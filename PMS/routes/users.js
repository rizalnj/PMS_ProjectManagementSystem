var express = require('express');
var router = express.Router();

// const auth = require('../helper/auth')
module.exports = (pool) => {
  var path = "user";
  // ============================= Router Users ============================= 
  router.get('/', (req, res) => {
    const { cuserid, userid, cemail, email, cname, name, ctype, type, croles, roles } = req.query;
    let temp = []
    const url = (req.url == '/') ? `?page=1` : req.url
    let page = req.query.page || 1;
    let limit = 2;
    let offset = (page - 1) * limit
    console.log(req.url)
    

    if (cuserid && userid) {
      temp.push(`userid = ${userid}`)
    }

    if (cemail && email) {
      temp.push(`email = "${email}"`)
    }

    if (cname && name) {
      temp.push(`name = ${name} `)
    }

    if (ctype && type) {
      temp.push(`typejob = ${type}`)
    }

    if (croles && roles) {
      temp.push(`roles = '${roles}'`)
    }

    let sql = `SELECT COUNT(*) as total FROM users`
    
    pool.query(sql, (err, count) => {
      const total = count.rows[0].total
      const pages = Math.ceil(total / limit)
       
      if (temp.length > 0) {
        sql += ` Where ${temp.join(" AND ")}`
      }
      
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
      
      pool.query(sql, (err, row) => {
        console.log(sql)
        pool.query(`SELECT useroption FROM users WHERE userid = ${req.session.user.userid}`, (err, data) => {
          res.render('users/index', {
            data: row.rows,
            query: req.query,
            isAdmin: req.session.user,
            option : data.rows[0].useroption,
            path,
            pages : pages,
            current:page,
            url:url
          });
        })
      })
    })
  });
  return router;
}


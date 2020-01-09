var express = require('express');
var router = express.Router();

// const auth = require('../helper/auth')
// const util = require('../helper/util')
const pathnode = require('path')

var moment = require('moment')
moment().format()

module.exports = (pool) => {

  var path = "/projects";

  // ============================= Router Home Redirect /projects =============================
  router.get('/',  function (req, res, next) {

    const { cprojectid, projectid, cname, name, cmember, member } = req.query;

    const url = (req.url == '/') ? `/?page=1` : req.url

    const page = req.query.page || 1;
    const limit = 3;
    const offset = (page - 1) * limit

    let params = [];


    if (cprojectid && projectid) {
      params.push(`projects.projectid = ${projectid}`);
    }

    if (cname && name) {
      params.push(`projects.name = '${name}'`)
    }

    if (cmember && member) {
      params.push(`members.userid = ${member}`)
    }

    let sql = `SELECT COUNT(id) as total FROM (SELECT DISTINCT projects.projectid AS id FROM projects LEFT JOIN members ON projects.projectid = members.projectid`;

    if (params.length > 0) {
      sql += ` WHERE ${params.join(" AND ")}`
    }

    sql += `) AS projectmember`;

    pool.query(sql, (err, count) => {
      const total = count.rows[0].total
      const pages = Math.ceil(total / limit)

      sql = `SELECT DISTINCT projects.projectid, projects.name FROM projects LEFT JOIN members ON projects.projectid = members.projectid`

      if (params.length > 0) {
        sql += ` WHERE ${params.join(" AND ")}`
      }

      sql += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`

      let subquery = `SELECT DISTINCT projects.projectid FROM projects LEFT JOIN members ON projects.projectid = members.projectid`

      subquery += ` ORDER BY projects.projectid LIMIT ${limit} OFFSET ${offset}`

      let sqlMembers = `SELECT projects.projectid, CONCAT (users.firstname,' ',users.lastname) AS fullname FROM projects LEFT JOIN members ON projects.projectid = members.projectid LEFT JOIN users ON users.userid = members.userid WHERE projects.projectid IN (${subquery})`


      pool.query(sql, (err, projectData) => {
        pool.query(sqlMembers, (err, memberData) => {

          projectData.rows.map(projects => {

            projects.members = memberData.rows.filter(member => { return member.projectid == projects.projectid }).map(item => item.fullname)
          })

          let sqlusers = `SELECT * FROM users`;
          let sqloption = `SELECT projectoption  FROM users  WHERE userid = ${req.session.user.userid}`;

          pool.query(sqlusers, (err, data) => {
            pool.query(sqloption, (err, option) => {
              // console.log(typeof option.rows[0].projectoption);

              res.render('project/index', {
                data: projectData.rows,
                query: req.query,
                users: data.rows,
                current: page,
                pages: pages,
                url: url,
                option: option.rows[0].projectoption,
                path,
                isAdmin: req.session.user
              })
            })
          })
        })
      })
    })
  });
  return router
}

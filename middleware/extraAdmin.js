const sessionsCheck = async (req, res, next) => {
    try {
        if (req.session.admin) {
            
            next()
        }
        else {
            
            res.render("admin/adminlogin");

        }

    } catch (erorr) {
        console.log(erorr.message)
    }
}

module.exports = {
    sessionsCheck
}
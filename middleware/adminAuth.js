const isLogin = async (req, res, next) => {
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

const isLogout = async (req, res, next) => {
    try {
        if (!req.session.admin) {

            next()
        } else {
            res.redirect('/')
        }

    } catch (erorr) {
        console.log(erorr.message)
    }
}

module.exports = {
    isLogin,
    isLogout
}
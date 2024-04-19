const isLogin = async (req, res, next) => {
    try {
        if (req.session.admin) {
            
            next()
        }
        else {
            
            res.redirect("/adminlogin");

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
            res.redirect('/adminlogin')
        }

    } catch (erorr) {
        console.log(erorr.message)
    }
}

module.exports = {
    isLogin,
    isLogout
}
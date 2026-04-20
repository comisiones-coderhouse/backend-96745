class ViewsController {

    static getView = (res, viewName) => {
        res.render(viewName)
    }

    static getLanding = (_req, res) => {
        this.getView(res, "index")
    }

    static getProducts = (_req, res) => {
        this.getView(res, "productos")
    }

    static getChat = (_req, res) => {
        this.getView(res, "chat")
    }
}

export default ViewsController
using Microsoft.AspNetCore.Mvc;

namespace Beyti_MVC.Controllers
{
    public class AdminController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

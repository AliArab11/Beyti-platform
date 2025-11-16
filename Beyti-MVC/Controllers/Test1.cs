using Microsoft.AspNetCore.Mvc;

namespace Beyti_MVC.Controllers
{
    public class Test1 : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

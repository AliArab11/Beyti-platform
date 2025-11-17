using Microsoft.AspNetCore.Mvc;

namespace Beyti_MVC.Controllers
{
    public class DriverController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

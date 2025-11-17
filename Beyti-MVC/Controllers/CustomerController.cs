using Microsoft.AspNetCore.Mvc;

namespace Beyti_MVC.Controllers
{
    public class CustomerController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

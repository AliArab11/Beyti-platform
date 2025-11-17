using Microsoft.AspNetCore.Mvc;

namespace Beyti_MVC.Controllers
{
    public class ServiceProviderController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

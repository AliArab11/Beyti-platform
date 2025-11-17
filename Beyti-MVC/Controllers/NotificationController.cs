using Microsoft.AspNetCore.Mvc;

namespace Beyti_MVC.Controllers
{
    public class NotificationController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

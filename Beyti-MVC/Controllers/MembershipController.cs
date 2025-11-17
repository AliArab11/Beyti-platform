using Microsoft.AspNetCore.Mvc;

namespace Beyti_MVC.Controllers
{
    public class MembershipController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}

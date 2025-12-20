using System.ComponentModel.DataAnnotations;

namespace Beyti_Backend.DTOs
{
    public class AnnouncementCreateDto
    {
        [Required]
        public int AdminUserId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = null!;

        [Required]
        public string Message { get; set; } = null!;

        [Required]
        [MinLength(1, ErrorMessage = "At least one audience must be selected")]
        public List<string> Audiences { get; set; } = new();

        public DateTime? ExpiresAt { get; set; }
    }
}

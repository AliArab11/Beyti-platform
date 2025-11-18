using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("ServiceReview")]
[Index("ServiceBookingId", Name = "IX_ServiceReview_Booking")]
[Index("CustomerId", Name = "IX_ServiceReview_Customer")]
[Index("ServiceProviderId", Name = "IX_ServiceReview_Provider")]
public partial class ServiceReview
{
    [Key]
    public int Id { get; set; }

    public int ServiceBookingId { get; set; }

    public int ServiceProviderId { get; set; }

    public int CustomerId { get; set; }

    public int OverallRating { get; set; }

    public int? QualityRating { get; set; }

    public int? ProfessionalismRating { get; set; }

    public int? TimelinessRating { get; set; }

    public string? Comment { get; set; }

    public string? ProviderResponse { get; set; }

    [Precision(3)]
    public DateTime? RespondedAt { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [ForeignKey("CustomerId")]
    [InverseProperty("ServiceReviews")]
    public virtual Customer Customer { get; set; } = null!;

    [ForeignKey("ServiceBookingId")]
    [InverseProperty("ServiceReviews")]
    public virtual ServiceBooking ServiceBooking { get; set; } = null!;

    [ForeignKey("ServiceProviderId")]
    [InverseProperty("ServiceReviews")]
    public virtual ServiceProvider ServiceProvider { get; set; } = null!;
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("ServiceBooking")]
[Index("CustomerId", Name = "IX_ServiceBooking_Customer")]
[Index("ServiceProviderId", Name = "IX_ServiceBooking_Provider")]
[Index("ServiceAddressId", Name = "IX_ServiceBooking_ServiceAddress")]
[Index("Status", Name = "IX_ServiceBooking_Status")]
public partial class ServiceBooking
{
    [Key]
    public int Id { get; set; }

    public int CustomerId { get; set; }

    public int ServiceProviderId { get; set; }

    public int ServiceCatalogId { get; set; }

    public int ServiceAddressId { get; set; }

    public int? TimeSlotId { get; set; }

    [Precision(3)]
    public DateTime BookingDateTime { get; set; }

    [StringLength(30)]
    public string Status { get; set; } = null!;

    [StringLength(20)]
    public string ServiceType { get; set; } = null!;

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? QuotedPrice { get; set; }

    [Column(TypeName = "numeric(12, 3)")]
    public decimal? DepositAmount { get; set; }

    [Column(TypeName = "numeric(12, 3)")]
    public decimal? FinalAmount { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    [StringLength(20)]
    public string? CanceledBy { get; set; }

    [StringLength(300)]
    public string? CancellationReason { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? CancellationFee { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; }

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [ForeignKey("CustomerId")]
    [InverseProperty("ServiceBookings")]
    public virtual Customer Customer { get; set; } = null!;

    [InverseProperty("ServiceBooking")]
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    [ForeignKey("ServiceAddressId")]
    [InverseProperty("ServiceBookings")]
    public virtual Address ServiceAddress { get; set; } = null!;

    [ForeignKey("ServiceCatalogId")]
    [InverseProperty("ServiceBookings")]
    public virtual ServiceCatalog ServiceCatalog { get; set; } = null!;

    [ForeignKey("ServiceProviderId")]
    [InverseProperty("ServiceBookings")]
    public virtual ServiceProvider ServiceProvider { get; set; } = null!;

    [InverseProperty("ServiceBooking")]
    public virtual ICollection<ServiceReview> ServiceReviews { get; set; } = new List<ServiceReview>();

    [ForeignKey("TimeSlotId")]
    [InverseProperty("ServiceBookings")]
    public virtual TimeSlot? TimeSlot { get; set; }
}

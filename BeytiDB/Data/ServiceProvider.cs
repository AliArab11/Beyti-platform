using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BeytiDB.Data;

[Table("ServiceProvider")]
[Index("UserProfileId", Name = "IX_ServiceProvider_UserProfile")]
[Index("UserProfileId", Name = "UQ__ServiceP__9E267F63B0BE6E36", IsUnique = true)]
public partial class ServiceProvider
{
    [Key]
    public int Id { get; set; }

    public int UserProfileId { get; set; }

    public int ServiceCategoryId { get; set; }

    [StringLength(120)]
    public string BusinessName { get; set; } = null!;

    [StringLength(30)]
    public string? Phone { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? MinServicePrice { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? MaxServicePrice { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = "Active";

    [Precision(3)]
    public DateTime? VerifiedAt { get; set; }

    [Precision(3)]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Precision(3)]
    public DateTime UpdatedAt { get; set; }

    [InverseProperty("ServiceProvider")]
    public virtual ICollection<ProviderApplication> ProviderApplications { get; set; } = new List<ProviderApplication>();

    [InverseProperty("ServiceProvider")]
    public virtual ICollection<ServiceBooking> ServiceBookings { get; set; } = new List<ServiceBooking>();

    [InverseProperty("ServiceProvider")]
    public virtual ICollection<ServiceProviderAddress> ServiceProviderAddresses { get; set; } = new List<ServiceProviderAddress>();

    [InverseProperty("ServiceProvider")]
    public virtual ICollection<ServiceReview> ServiceReviews { get; set; } = new List<ServiceReview>();

    [InverseProperty("ServiceProvider")]
    public virtual ICollection<Service> Services { get; set; } = new List<Service>();

    [InverseProperty("ServiceProvider")]
    public virtual ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();

    [ForeignKey("UserProfileId")]
    [InverseProperty("ServiceProvider")]
    public virtual UserProfile UserProfile { get; set; } = null!;

    [ForeignKey("ServiceCategoryId")]
    [InverseProperty("ServiceProviders")]
    public virtual ServiceCategory ServiceCategory { get; set; } = null!;
}
